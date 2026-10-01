"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approveApplication } from "../_lib/actions";
import { STATUS_LABELS, STATUS_STYLES } from "./status-badge";

type Props = {
  applicationId: string;
  studentName: string;
};

export function ApproveStatusButton({ applicationId, studentName }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (isPending) return; // don't close while approving
    setOpen(next);
    if (!next) setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await approveApplication(applicationId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Click to approve"
        aria-label={`Approve application of ${studentName}`}
        className={cn(
          "inline-flex cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-amber-300 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          STATUS_STYLES.pending,
        )}
      >
        {STATUS_LABELS.pending}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application?</DialogTitle>
            <DialogDescription>
              You are about to approve the application of{" "}
              <span className="font-medium text-foreground">{studentName}</span>
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={confirm}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
