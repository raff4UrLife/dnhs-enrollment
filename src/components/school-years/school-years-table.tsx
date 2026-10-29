// src/components/school-years/school-years-table.tsx
"use client";

import { Check } from "lucide-react";
import type { SchoolYearRow } from "@/lib/school-years/data";
import { ActiveSwitch } from "./active-switch";
import { ApplicationsToggle } from "./applications-toggle";

export type RowActionResult = { ok: true } | { ok: false; error: string };

// Pass this to make the table editable. Leave it out for a read-only table
// (the offline page will do that).
export type SchoolYearActions = {
  onSetActive: (id: string) => Promise<RowActionResult>;
  onSetApplicationEnabled: (
    id: string,
    enabled: boolean,
  ) => Promise<RowActionResult>;
};

type Props = {
  rows: SchoolYearRow[];
  actions?: SchoolYearActions;
};

export function SchoolYearsTable({ rows, actions }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-secondary/5 text-left text-xs uppercase tracking-wide text-secondary">
          <tr>
            <th className="w-16 px-5 py-3.5 font-semibold">#</th>
            <th className="px-5 py-3.5 font-semibold">School year</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold">Online applications</th>
            {actions && (
              <th className="px-5 py-3.5 text-right font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={actions ? 5 : 4}
                className="px-5 py-10 text-center text-muted-foreground"
              >
                No school years yet.
              </td>
            </tr>
          )}

          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                row.is_active
                  ? "border-t bg-primary/5"
                  : "border-t transition-colors hover:bg-secondary/5"
              }
            >
              {/* Row number is just the position, never stored in the DB.
                  The gold bar on the active row is an inset shadow because
                  borders on <tr> are unreliable in collapsed tables. */}
              <td
                className={
                  row.is_active
                    ? "px-5 py-4 text-muted-foreground shadow-[inset_4px_0_0_var(--primary)]"
                    : "px-5 py-4 text-muted-foreground"
                }
              >
                {index + 1}
              </td>
              <td
                className={
                  row.is_active
                    ? "px-5 py-4 text-base font-bold text-secondary"
                    : "px-5 py-4 font-medium"
                }
              >
                {row.name}
              </td>
              <td className="px-5 py-4">
                {row.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <span className="size-1.5 rounded-full bg-primary-foreground" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <ApplicationsToggle
                  enabled={row.application_enabled}
                  onChange={
                    actions
                      ? (next: boolean) =>
                          actions.onSetApplicationEnabled(row.id, next)
                      : undefined
                  }
                />
              </td>
              {actions && (
                <td className="px-5 py-4 text-right">
                  {row.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                      <Check className="size-4 text-primary" />
                      Current
                    </span>
                  ) : (
                    <ActiveSwitch
                      schoolYearName={row.name}
                      onConfirm={() => actions.onSetActive(row.id)}
                    />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
