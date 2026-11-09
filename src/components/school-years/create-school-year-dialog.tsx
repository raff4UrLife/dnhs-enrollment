// src/components/school-years/create-school-year-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type CreateSummary = {
  copiedSections: number;
  promoted: number;
  retained: number;
  graduated: number;
  needsStrand: number;
};

type CreateResult =
  | ({ ok: true } & CreateSummary)
  | { ok: false; error: string };

type Props = {
  // Pre-filled name, e.g. "2027-2028"
  suggestedName: string;
  onCreate: (name: string) => Promise<CreateResult>;
};

export function CreateSchoolYearDialog({ suggestedName, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreateSummary | null>(null);
  const [createdName, setCreatedName] = useState("");
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setName(suggestedName);
    setError(null);
    setSummary(null);
    setOpen(true);
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await onCreate(name);
      if (result.ok) {
        setCreatedName(name.trim());
        setSummary({
          copiedSections: result.copiedSections,
          promoted: result.promoted,
          retained: result.retained,
          graduated: result.graduated,
          needsStrand: result.needsStrand,
        });
      } else {
        setError(result.error);
      }
    });
  }

  const rows: { label: string; value: number }[] = summary
    ? [
        { label: "Sections copied", value: summary.copiedSections },
        { label: "Promoted to the next grade", value: summary.promoted },
        { label: "Stayed in the same grade", value: summary.retained },
        { label: "Graduated (Grade 12)", value: summary.graduated },
      ]
    : [];

  return (
    <>
      <Button onClick={openDialog}>
        <Plus className="mr-1 size-4" />
        New school year
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-sy-title"
            className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-secondary text-secondary-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-4">
              <h2 id="create-sy-title" className="text-lg font-semibold">
                {summary
                  ? `School year ${createdName} created`
                  : "Create school year"}
              </h2>
            </div>

            {summary ? (
              <>
                {/* Result */}
                <div className="space-y-4 px-6 py-5">
                  <ul className="divide-y divide-white/10 rounded-md bg-white/10 text-sm">
                    {rows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span>{row.label}</span>
                        <span className="font-semibold text-primary">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {summary.needsStrand > 0 && (
                    <p className="rounded-md bg-white/10 px-4 py-3 text-sm leading-relaxed">
                      {summary.needsStrand} Grade 10 learner
                      {summary.needsStrand === 1 ? "" : "s"} moving to Grade 11
                      still need a strand. Set it on the Enrollment page; they
                      are sectioned after that.
                    </p>
                  )}
                </div>

                <div className="flex justify-end border-t border-white/10 px-6 py-4">
                  <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
              </>
            ) : (
              <>
                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-md bg-white/10 px-4 py-3 text-sm leading-relaxed">
                    The previous year&apos;s sections are copied into the new
                    year, and its active learners move in: promoted one grade
                    (average 75 and above), kept in the same grade (74 and
                    below), or graduated (Grade 12 with 75 and above). The new
                    year starts inactive with online applications closed.
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="sy-name"
                      className="text-sm font-medium text-primary"
                    >
                      School year
                    </label>
                    <input
                      id="sy-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="2027-2028"
                      disabled={pending}
                      className="w-full rounded-md border border-transparent bg-white px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
                    />
                    <p className="text-xs text-secondary-foreground/70">
                      Format: 2027-2028 (the second year is the first plus one).
                    </p>
                    {error && (
                      <p className="text-sm font-medium text-red-300">
                        {error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-white/10 px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="border-white/30 bg-transparent text-secondary-foreground hover:bg-white/10 hover:text-secondary-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={pending || !name.trim()}
                  >
                    {pending && (
                      <Loader2 className="mr-1 size-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
