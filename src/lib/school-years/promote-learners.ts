// src/lib/school-years/promote-learners.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickSection } from "@/lib/enrollment/sectioning";
import { loadSectionCandidates } from "@/lib/enrollment/section-data";
import type { CurrentStaff } from "@/lib/auth/require-role";
import {
  writeAuditLogs,
  type AuditLogInput,
} from "@/lib/audit/write-audit-log";
import { decidePromotion } from "./promotion-rule";
import { loadPreviousEnrollments } from "./promotion-data";

export type PromoteResult =
  | {
      ok: true;
      promoted: number; // moved up one grade
      retained: number; // 74 and below, same grade
      graduated: number; // Grade 12 with 75 or above
      needsStrand: number; // Grade 10 -> 11, strand to be set later
    }
  | { ok: false; error: string };

type Placement = {
  learnerId: string;
  kind: "promoted" | "retained";
  fromGrade: number;
  fromFinal: number | null;
  gradeLevel: number;
  trackId: string | null;
  strandId: string | null;
  average: number;
  needsStrand: boolean;
};

type Graduate = {
  learnerId: string;
  fromGrade: number;
  fromFinal: number | null;
};

const CHUNK = 500;

function chunk<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    out.push(items.slice(i, i + CHUNK));
  }
  return out;
}

// Moves last year's active learners into the new school year.
// Call this AFTER the new year and its sections exist.
// `actor` is the admin who started it; it is saved in the audit log.
export async function promoteLearners(
  previousSchoolYearId: string,
  newSchoolYearId: string,
  actor: CurrentStaff | null = null,
): Promise<PromoteResult> {
  const admin = createAdminClient();

  const loaded = await loadPreviousEnrollments(previousSchoolYearId);
  if (!loaded.ok) return loaded;

  // 1. Decide every learner's outcome (pure rule, no database)
  const placements: Placement[] = [];
  const graduates: Graduate[] = [];
  let promoted = 0;
  let retained = 0;
  let needsStrand = 0;

  for (const row of loaded.rows) {
    const outcome = decidePromotion({
      gradeLevel: row.gradeLevel,
      finalAverage: row.finalAverage,
      entryAverage: row.entryAverage,
    });

    if (outcome.kind === "graduated") {
      graduates.push({
        learnerId: row.learnerId,
        fromGrade: row.gradeLevel,
        fromFinal: row.finalAverage ?? null,
      });
      continue;
    }

    const strandPending = outcome.kind === "promoted" && outcome.needsStrand;
    if (outcome.kind === "promoted") promoted++;
    else retained++;
    if (strandPending) needsStrand++;

    placements.push({
      learnerId: row.learnerId,
      kind: outcome.kind,
      fromGrade: row.gradeLevel,
      fromFinal: row.finalAverage ?? null,
      gradeLevel: outcome.nextGrade,
      trackId: strandPending ? null : row.trackId,
      strandId: strandPending ? null : row.strandId,
      average: outcome.average ?? row.entryAverage,
      needsStrand: strandPending,
    });
  }

  // 2. Build the new enrollments. Learners without a strand yet get no section.
  const rows: {
    learner_id: string;
    school_year_id: string;
    grade_level: number;
    average: number;
    track_id: string | null;
    strand_id: string | null;
    section_id: string | null;
    status: "enrolled";
    section_manual: boolean;
  }[] = [];

  // learner id -> section picked (used for the audit log)
  const sectionByLearner = new Map<string, string | null>();

  const toSection = new Map<string, Placement[]>();
  for (const p of placements) {
    if (p.needsStrand) {
      sectionByLearner.set(p.learnerId, null);
      rows.push({
        learner_id: p.learnerId,
        school_year_id: newSchoolYearId,
        grade_level: p.gradeLevel,
        average: p.average,
        track_id: null,
        strand_id: null,
        section_id: null,
        status: "enrolled",
        section_manual: false,
      });
      continue;
    }
    const key = `${p.gradeLevel}|${p.trackId ?? ""}|${p.strandId ?? ""}`;
    const list = toSection.get(key) ?? [];
    list.push(p);
    toSection.set(key, list);
  }

  // 3. Section each group by average, highest first, so the top learners
  //    fill the first sections.
  for (const list of toSection.values()) {
    const first = list[0];
    const loadedSections = await loadSectionCandidates(admin, {
      schoolYearId: newSchoolYearId,
      gradeLevel: first.gradeLevel,
      trackId: first.trackId,
      strandId: first.strandId,
    });
    if (!loadedSections.ok) return loadedSections;

    const candidates = loadedSections.candidates;
    list.sort((a, b) => b.average - a.average);

    for (const p of list) {
      const sectionId = pickSection(candidates, p.average);
      if (sectionId) {
        const picked = candidates.find((c) => c.id === sectionId);
        if (picked) picked.count += 1;
      }
      sectionByLearner.set(p.learnerId, sectionId);
      rows.push({
        learner_id: p.learnerId,
        school_year_id: newSchoolYearId,
        grade_level: p.gradeLevel,
        average: p.average,
        track_id: p.trackId,
        strand_id: p.strandId,
        section_id: sectionId,
        status: "enrolled",
        section_manual: false,
      });
    }
  }

  // 4. Insert in chunks. On any failure, remove what was added.
  for (const part of chunk(rows)) {
    const { error } = await admin.from("enrollments").insert(part);
    if (error) {
      console.error("[promote-learners] step=insert-enrollments", error);
      await admin
        .from("enrollments")
        .delete()
        .eq("school_year_id", newSchoolYearId);
      return { ok: false, error: "Could not create the new enrollments." };
    }
  }

  // 5. Graduates: last year's enrollment and the learner become graduated
  const graduatedIds = graduates.map((g) => g.learnerId);
  for (const part of chunk(graduatedIds)) {
    const { error: enrollErr } = await admin
      .from("enrollments")
      .update({ status: "graduated" })
      .eq("school_year_id", previousSchoolYearId)
      .in("learner_id", part);

    const { error: learnerErr } = await admin
      .from("learners")
      .update({ status: "graduated" })
      .in("id", part);

    if (enrollErr || learnerErr) {
      console.error(
        "[promote-learners] step=graduate",
        enrollErr ?? learnerErr,
      );
      await admin
        .from("enrollments")
        .delete()
        .eq("school_year_id", newSchoolYearId);
      return { ok: false, error: "Could not mark graduates." };
    }
  }

  // 6. Audit log: one row per learner, written only after everything above
  //    succeeded. A failed log never undoes the promotion (it shows in the
  //    terminal instead).
  const logs: AuditLogInput[] = [];

  for (const p of placements) {
    logs.push({
      entityType: "learner",
      entityId: p.learnerId,
      action: p.kind, // "promoted" | "retained"
      actor,
      learnerId: p.learnerId,
      schoolYearId: newSchoolYearId,
      oldValues: {
        school_year_id: previousSchoolYearId,
        grade_level: p.fromGrade,
        final_average: p.fromFinal,
      },
      newValues: {
        school_year_id: newSchoolYearId,
        grade_level: p.gradeLevel,
        average: p.average,
        section_id: sectionByLearner.get(p.learnerId) ?? null,
      },
      note: p.needsStrand ? "Strand to be set by admin" : null,
    });
  }

  for (const g of graduates) {
    logs.push({
      entityType: "learner",
      entityId: g.learnerId,
      action: "graduated",
      actor,
      learnerId: g.learnerId,
      schoolYearId: previousSchoolYearId,
      oldValues: {
        grade_level: g.fromGrade,
        final_average: g.fromFinal,
        status: "active",
      },
      newValues: { status: "graduated" },
    });
  }

  await writeAuditLogs(logs);

  return {
    ok: true,
    promoted,
    retained,
    graduated: graduates.length,
    needsStrand,
  };
}
