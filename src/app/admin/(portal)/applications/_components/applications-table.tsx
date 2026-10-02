import type { ApplicationRow } from "../_lib/types";
import { ApplicationTableRow } from "./application-row";

const HEADERS = [
  "View Details",
  "LRN",
  "Name",
  "Grade level",
  "Strand",
  "Gender",
  "Status",
];

type Props = {
  rows: ApplicationRow[];
  canApprove: boolean; // admin or staff (teachers are view-only)
};

export function ApplicationsTable({ rows, canApprove }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-black/5 bg-white shadow-sm">
      <table className="w-full min-w-205 border-collapse text-left">
        <thead>
          <tr className="border-b border-black/5 bg-slate-50">
            {HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ApplicationTableRow
              key={row.id}
              row={row}
              canApprove={canApprove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
