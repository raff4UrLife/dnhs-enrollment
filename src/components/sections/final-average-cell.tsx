// src/components/sections/final-average-cell.tsx
"use client";

import { useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RosterActionResult } from "@/lib/sections/types";

type FinalAverageCellProps = {
  enrollmentId: string;
  value: number | null;
  // false for teachers and in the offline preview: shows plain text only.
  canEdit: boolean;
  // Passed in by the page (updateFinalAverage). This component imports no server
  // code, so it also works in the offline preview.
  onSave: (
    enrollmentId: string,
    value: number | null,
  ) => Promise<RosterActionResult>;
};

type Status = "idle" | "saving" | "saved" | "error";

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

// "" = clear (null). Anything else must be a number from 0 to 100.
function parseInput(
  text: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const clean = text.trim();
  if (clean === "") return { ok: true, value: null };

  const number = Number(clean);
  if (!Number.isFinite(number)) return { ok: false, error: "Enter a number." };
  if (number < 0 || number > 100) {
    return { ok: false, error: "Must be 0 to 100." };
  }
  return { ok: true, value: Math.round(number * 100) / 100 };
}

// Moves to the next final average box in the table, for fast entry.
function focusNext(current: HTMLInputElement) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-final-average]"),
  );
  const next = inputs[inputs.indexOf(current) + 1];
  if (next) {
    next.focus();
    next.select();
  }
}

export function FinalAverageCell({
  enrollmentId,
  value,
  canEdit,
  onSave,
}: FinalAverageCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saved, setSaved] = useState(value); // last value known to be in the database
  const [text, setText] = useState(toText(value));
  const [prevValue, setPrevValue] = useState(value);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // Follow the data when it changes from outside (for example after a refresh).
  if (value !== prevValue) {
    setPrevValue(value);
    setSaved(value);
    setText(toText(value));
  }

  if (!canEdit) {
    return value === null ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      <span>{value.toFixed(2)}</span>
    );
  }

  const parsed = parseInput(text);
  const dirty = !parsed.ok || parsed.value !== saved;
  const saving = status === "saving";

  async function handleEnter() {
    if (saving || !inputRef.current) return;
    const input = inputRef.current;

    if (!parsed.ok) {
      setStatus("error");
      setError(parsed.error);
      return;
    }

    // Nothing changed: just go to the next row.
    if (!dirty) {
      focusNext(input);
      return;
    }

    setStatus("saving");
    setError("");
    const result = await onSave(enrollmentId, parsed.value);

    if (!result.ok) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setSaved(parsed.value);
    setText(toText(parsed.value));
    setStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setStatus("idle"), 1500);
    focusNext(input);
  }

  function handleEscape() {
    setText(toText(saved));
    setStatus("idle");
    setError("");
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          data-final-average
          type="text"
          inputMode="decimal"
          value={text}
          readOnly={saving}
          placeholder="Enter"
          aria-label="Final average"
          aria-invalid={status === "error"}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            if (status !== "saving") {
              setStatus("idle");
              setError("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleEnter();
            } else if (e.key === "Escape") {
              handleEscape();
            }
          }}
          className={cn(
            "h-9 w-24 rounded-md border bg-white px-2 text-right text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            status === "error"
              ? "border-destructive"
              : dirty
                ? "border-amber-500"
                : "border-input",
          )}
        />

        <span className="flex size-4 items-center justify-center">
          {saving && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {status === "saved" && <Check className="size-4 text-green-600" />}
        </span>
      </div>

      {status === "error" && error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : dirty && !saving ? (
        <span className="text-xs text-muted-foreground">Enter to save</span>
      ) : null}
    </div>
  );
}
