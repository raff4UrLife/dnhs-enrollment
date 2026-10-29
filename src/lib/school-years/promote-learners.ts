// src/lib/school-years/promote-learners.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickSection } from "@/lib/enrollment/sectioning";
import { loadSectionCandidates } from "@/lib/enrollment/section-data";
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
  gradeLevel: number;
  trackId: string | null;
  strandId: string | null;
  average: number;
  needsStrand: boolean;
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
export async function promoteLearners(
  previousSchoolYearId: string,
  newSchoolYearId: string,
): Promise<PromoteResult> {
  const admin = createAdminClient();

  const loaded = await loadPreviousEnrollments(previousSchoolYearId);
  if (!loaded.ok) return loaded;

  // 1. Decide every learner's outcome (pure rule, no database)
  const placements: Placement[] = [];
  const graduatedIds: string[] = [];
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
      graduatedIds.push(row.learnerId);
      continue;
    }

    const strandPending = outcome.kind === "promoted" && outcome.needsStrand;
    if (outcome.kind === "promoted") promoted++;
    else retained++;
    if (strandPending) needsStrand++;

    placements.push({
      learnerId: row.learnerId,
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

  const toSection = new Map<string, Placement[]>();
  for (const p of placements) {
    if (p.needsStrand) {
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

  return {
    ok: true,
    promoted,
    retained,
    graduated: graduatedIds.length,
    needsStrand,
  };
}
