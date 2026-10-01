import type { ApplicationRow } from "../_lib/types";
import { ApproveStatusButton } from "./approve-status-button";
import { StatusBadge } from "./status-badge";
import { ViewButton } from "./view-button";

type Props = {
  row: ApplicationRow;
  canApprove: boolean; // admin or staff (teachers are view-only)
};

export function ApplicationTableRow({ row, canApprove }: Props) {
  const fullName = `${row.last_name}, ${row.first_name}${
    row.middle_name ? ` ${row.middle_name}` : ""
  }`;

  return (
    <tr className="border-b border-black/5 transition-colors last:border-0 hover:bg-slate-50">
      <td className="whitespace-nowrap px-4 py-3">
        <ViewButton applicationId={row.id} studentName={fullName} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
        {row.lrn}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {fullName}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        Grade {row.grade_level}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {row.strand_name ?? <span className="text-muted-foreground">-</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {row.gender}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {canApprove && row.status === "pending" ? (
          <ApproveStatusButton applicationId={row.id} studentName={fullName} />
        ) : (
          <StatusBadge status={row.status} />
        )}
      </td>
    </tr>
  );
}
