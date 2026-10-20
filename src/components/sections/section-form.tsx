// src/components/sections/section-form.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  createSection,
  updateSection,
  type SectionInput,
} from "@/app/admin/(portal)/manage-sections/actions";
import type { ManageSection, ManageStrand } from "@/lib/sections/manage-data";

type Props = {
  schoolYearId: string;
  strands: ManageStrand[];
  // Pass a section to edit it. Leave out to add a new one.
  section?: ManageSection;
  onDone: () => void;
  onCancel: () => void;
};

const GRADES = [7, 8, 9, 10, 11, 12];

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export default function SectionForm({
  schoolYearId,
  strands,
  section,
  onDone,
  onCancel,
}: Props) {
  const isEdit = Boolean(section);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [gradeLevel, setGradeLevel] = useState(
    String(section?.gradeLevel ?? 7),
  );
  const [strandId, setStrandId] = useState(section?.strandId ?? "");
  const [sectionName, setSectionName] = useState(section?.name ?? "");
  const [teacherName, setTeacherName] = useState(section?.teacherName ?? "");
  const [sectionOrder, setSectionOrder] = useState(
    String(section?.sectionOrder ?? 1),
  );
  const [capacity, setCapacity] = useState(String(section?.capacity ?? 40));

  const isSeniorHigh = Number(gradeLevel) >= 11;
  // The database refuses grade/strand changes once learners are enrolled.
  const locked = isEdit && (section?.enrollmentCount ?? 0) > 0;

  // Strands grouped by track for the dropdown.
  const strandGroups = new Map<string, ManageStrand[]>();
  for (const strand of strands) {
    const group = strand.trackName ?? "Other";
    strandGroups.set(group, [...(strandGroups.get(group) ?? []), strand]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input: SectionInput = {
      gradeLevel: Number(gradeLevel),
      strandId: isSeniorHigh ? strandId || null : null,
      sectionName,
      teacherName,
      sectionOrder: Number(sectionOrder),
      capacity: Number(capacity),
    };

    startTransition(async () => {
      const result =
        isEdit && section
          ? await updateSection(section.id, input)
          : await createSection(schoolYearId, input);

      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-black/10 bg-white p-5 shadow-sm"
    >
      <h2 className="font-serif text-lg font-semibold">
        {isEdit ? `Edit ${section?.name}` : "Add a section"}
      </h2>

      {locked && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Grade level and strand are locked because this section has{" "}
          {section?.enrollmentCount} enrollment
          {section?.enrollmentCount === 1 ? "" : "s"}. Move the learners to
          another section first if you need to change them.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Grade level
          <select
            className={fieldClass}
            value={gradeLevel}
            disabled={locked || isPending}
            onChange={(e) => setGradeLevel(e.target.value)}
          >
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </label>

        {isSeniorHigh && (
          <label className="space-y-1.5 text-sm font-medium">
            Strand
            <select
              className={fieldClass}
              value={strandId}
              disabled={locked || isPending}
              onChange={(e) => setStrandId(e.target.value)}
            >
              <option value="">Choose a strand</option>
              {[...strandGroups.entries()].map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((strand) => (
                    <option key={strand.id} value={strand.id}>
                      {strand.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1.5 text-sm font-medium">
          Section name
          <input
            className={fieldClass}
            value={sectionName}
            maxLength={100}
            disabled={isPending}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g. Mt. Arayat"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium">
          Adviser
          <input
            className={fieldClass}
            value={teacherName}
            maxLength={100}
            disabled={isPending}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Adviser's full name"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium">
          Section order
          <input
            className={fieldClass}
            type="number"
            min={1}
            step={1}
            value={sectionOrder}
            disabled={isPending}
            onChange={(e) => setSectionOrder(e.target.value)}
          />
          <span className="block text-xs font-normal text-muted-foreground">
            1 fills first. Learners go to the next order once a section is full.
          </span>
        </label>

        <label className="space-y-1.5 text-sm font-medium">
          Capacity
          <input
            className={fieldClass}
            type="number"
            min={1}
            step={1}
            value={capacity}
            disabled={isPending}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <span className="block text-xs font-normal text-muted-foreground">
            A soft limit. Going over it only shows a warning on the rosters.
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="h-10 rounded-md border border-input bg-white px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save changes" : "Add section"}
        </button>
      </div>
    </form>
  );
}
