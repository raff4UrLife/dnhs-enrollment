// src/components/sections/override-section-dialog.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  RosterActionResult,
  RosterSection,
  RosterStudent,
} from "@/lib/sections/types";
import { previewMove, type GenderCounts } from "@/lib/sections/gender-balance";
import { SelectField } from "./select-field";

type OverrideSectionDialogProps = {
  student: RosterStudent | null; // the learner being moved; null = closed
  sections: RosterSection[];
  // Gender counts per section, from countsBySection(students).
  counts: Map<string, GenderCounts>;
  onOpenChange: (open: boolean) => void;
  // Passed in by the page (overrideSection), so this file imports no server code.
  onSave: (
    enrollmentId: string,
    newSectionId: string,
    note?: string,
  ) => Promise<RosterActionResult>;
};

function studentName(s: RosterStudent): string {
  const middle = s.middleName ? ` ${s.middleName.charAt(0)}.` : "";
  const ext = s.extensionName ? ` ${s.extensionName}` : "";
  return `${s.lastName}, ${s.firstName}${middle}${ext}`;
}

function genderText(c: GenderCounts): string {
  return `${c.female} F · ${c.male} M`;
}

export function OverrideSectionDialog({
  student,
  sections,
  counts,
  onOpenChange,
  onSave,
}: OverrideSectionDialogProps) {
  return (
    <Dialog open={student !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {student && (
          <OverrideForm
            student={student}
            sections={sections}
            counts={counts}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OverrideForm({
  student,
  sections,
  counts,
  onOpenChange,
  onSave,
}: Omit<OverrideSectionDialogProps, "student"> & { student: RosterStudent }) {
  const [targetId, setTargetId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = sections.find((s) => s.id === student.sectionId);

  // Only sections of the same grade and strand (the server checks this too).
  const options = useMemo(
    () =>
      sections.filter(
        (s) =>
          s.id !== student.sectionId &&
          current !== undefined &&
          s.gradeLevel === current.gradeLevel &&
          s.strandLabel === current.strandLabel,
      ),
    [sections, student.sectionId, current],
  );

  const target = options.find((s) => s.id === targetId);
  const preview = target
    ? previewMove(counts, student, target.id, target.capacity)
    : null;

  function confirm() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await onSave(student.enrollmentId, target.id, note);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Move to another section</DialogTitle>
        <DialogDescription>
          Moving{" "}
          <span className="font-medium text-primary">
            {studentName(student)}
          </span>
          {current ? ` from ${current.name}` : ""}. The learner will be marked
          as moved manually.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 px-2.5 [&_label]:text-white/80">
        <SelectField
          label="New section"
          value={targetId}
          placeholder="Choose a section"
          disabled={isPending}
          options={options.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.studentCount}/${s.capacity})`,
          }))}
          onChange={setTargetId}
        />

        {options.length === 0 && (
          <p className="text-sm text-muted-foreground">
            There is no other section for this grade and strand.
          </p>
        )}

        {target && preview && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
            <p>
              <span className="font-medium">{current?.name}</span>:{" "}
              {genderText(preview.source.before)} →{" "}
              {genderText(preview.source.after)} ({preview.source.after.total}{" "}
              learners)
            </p>
            <p>
              <span className="font-medium">{target.name}</span>:{" "}
              {genderText(preview.target.before)} →{" "}
              {genderText(preview.target.after)} ({preview.target.after.total}/
              {target.capacity})
            </p>

            {preview.overCapacity && (
              <p className="text-amber-700">
                Warning: {target.name} will have more than its limit of{" "}
                {target.capacity}. You can still move the learner.
              </p>
            )}
            {preview.targetBalance === "better" && (
              <p className="text-green-700">
                This improves the male/female balance of {target.name}.
              </p>
            )}
            {preview.targetBalance === "worse" && (
              <p className="text-amber-700">
                This makes {target.name} less balanced between male and female.
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="override-note"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Reason (optional)
          </label>
          <input
            id="override-note"
            type="text"
            value={note}
            maxLength={300}
            disabled={isPending}
            placeholder="e.g. balance gender"
            onChange={(e) => setNote(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white! px-3 text-sm text-slate-900! caret-slate-900 outline-none placeholder:text-slate-400! focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="button" disabled={isPending || !target} onClick={confirm}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? "Moving..." : "Move learner"}
        </Button>
      </DialogFooter>
    </>
  );
}
