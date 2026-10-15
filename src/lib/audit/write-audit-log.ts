// src/lib/audit/write-audit-log.ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CurrentStaff } from "@/lib/auth/require-role";

export type AuditEntity = "application" | "learner" | "enrollment" | "section";

type Values = Record<string, unknown>;

export type AuditLogInput = {
  entityType: AuditEntity;
  entityId: string;
  action: string; // e.g. "approve", "update", "create", "section_change"
  actor: CurrentStaff | null; // null = done by the system
  learnerId?: string | null;
  schoolYearId?: string | null;
  oldValues?: Values | null;
  newValues?: Values | null;
  note?: string | null;
};

// Keeps only the fields that actually changed, so each row stays small.
export function diffValues(oldRow: Values, newRow: Values) {
  const oldValues: Values = {};
  const newValues: Values = {};
  for (const key of Object.keys(newRow)) {
    if (JSON.stringify(oldRow[key]) !== JSON.stringify(newRow[key])) {
      oldValues[key] = oldRow[key] ?? null;
      newValues[key] = newRow[key];
    }
  }
  return { oldValues, newValues };
}

// Never throws: a failed log must not break the real action.
// Returns true if saved. Errors show in the terminal.
export async function writeAuditLog(input: AuditLogInput): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      learner_id: input.learnerId ?? null,
      school_year_id: input.schoolYearId ?? null,
      changed_by: input.actor?.id ?? null,
      changed_by_label: input.actor
        ? `${input.actor.name ?? "Staff"} (${input.actor.role})`
        : "System",
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      note: input.note ?? null,
    });

    if (error) {
      console.error("[audit] insert failed:", error.message, input);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[audit] unexpected error:", err);
    return false;
  }
}
