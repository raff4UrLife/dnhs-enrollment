// src/components/school-years/applications-toggle.tsx
"use client";

import { useState, useTransition } from "react";
import type { RowActionResult } from "./school-years-table";

type Props = {
  enabled: boolean;
  // Leave this out for a read-only label (the offline page does that).
  onChange?: (next: boolean) => Promise<RowActionResult>;
};

// Open = dark gold (readable on white), Closed = muted gray.
const labelClass = (enabled: boolean) =>
  enabled
    ? "text-sm font-semibold text-amber-700"
    : "text-sm font-medium text-muted-foreground";

export function ApplicationsToggle({ enabled, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Read-only: just show the state.
  if (!onChange) {
    return (
      <span className={labelClass(enabled)}>{enabled ? "Open" : "Closed"}</span>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await onChange!(!enabled);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle online applications"
          disabled={pending}
          onClick={handleClick}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={labelClass(enabled)}>
          {enabled ? "Open" : "Closed"}
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
