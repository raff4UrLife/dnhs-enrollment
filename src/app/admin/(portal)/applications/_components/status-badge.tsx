import { cn } from "@/lib/utils";
import type { ApplicationRow } from "../_lib/types";

type Status = ApplicationRow["status"];

export const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  approved: "Approved",
};

export const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
