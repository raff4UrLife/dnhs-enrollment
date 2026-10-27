// src/components/school-years/active-switch.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RowActionResult } from "./school-years-table";

type Props = {
  schoolYearName: string;
  onConfirm: () => Promise<RowActionResult>;
};

export function ActiveSwitch({ schoolYearName, onConfirm }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        setConfirming(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Set active
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Make {schoolYearName} the active year?
        </span>
        <Button
          size="sm"
          variant="default"
          onClick={handleConfirm}
          disabled={pending}
        >
          {pending && <Loader2 className="mr-1 size-4 animate-spin" />}
          Confirm
        </Button>
        <Button
          size="sm"
          variant="navy"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
