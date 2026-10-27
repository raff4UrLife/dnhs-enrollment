// src/components/school-years/school-years-table.tsx
"use client";

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
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="w-16 px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">School year</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Online applications</th>
            {actions && (
              <th className="px-4 py-3 text-right font-medium">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={actions ? 5 : 4}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No school years yet.
              </td>
            </tr>
          )}

          {rows.map((row, index) => (
            <tr key={row.id} className="border-t">
              {/* Row number is just the position, never stored in the DB */}
              <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="px-4 py-3">
                {row.is_active ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                ) : (
                  <span className="text-muted-foreground">Inactive</span>
                )}
              </td>
              <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">
                  {!row.is_active && (
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
