// src/components/sections/manage-sections.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import type { ManageData, ManageSection } from "@/lib/sections/manage-data";
import SectionForm from "@/components/sections/section-form";

type Props = {
  data: ManageData;
};

export default function ManageSections({ data }: Props) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<ManageSection | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  function closeForm() {
    setShowForm(false);
    setEditingSection(null);
  }

  function handleDone() {
    closeForm();
    router.refresh();
  }

  const grades = [...new Set(data.sections.map((s) => s.gradeLevel))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="space-y-1.5 text-sm font-medium">
          School year
          <select
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-56"
            value={data.schoolYearId}
            onChange={(event) => {
              router.push(
                `/admin/manage-sections?schoolyear=${encodeURIComponent(
                  event.target.value,
                )}`,
              );
            }}
          >
            {data.schoolYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
                {year.isActive ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setEditingSection(null);
            setShowForm(true);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add section
        </button>
      </div>

      {(showForm || editingSection) && (
        <SectionForm
          key={editingSection?.id ?? "new-section"}
          schoolYearId={data.schoolYearId}
          strands={data.strands}
          section={editingSection ?? undefined}
          onDone={handleDone}
          onCancel={closeForm}
        />
      )}

      <div className="space-y-6">
        {grades.length === 0 ? (
          <div className="rounded-lg border bg-white px-4 py-10 text-center">
            <p className="text-sm font-medium">No sections found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a section for S.Y. {data.schoolYearLabel} to get started.
            </p>
          </div>
        ) : (
          grades.map((grade) => {
            const sections = data.sections.filter(
              (section) => section.gradeLevel === grade,
            );

            return (
              <section
                key={grade}
                className="overflow-hidden rounded-lg border border-black/10 bg-white"
              >
                <div className="border-b border-black/10 bg-muted/40 px-4 py-3">
                  <h2 className="font-semibold">Grade {grade}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {sections.length} section
                    {sections.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="divide-y divide-black/10">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-medium">{section.name}</h3>

                        <p className="text-sm text-muted-foreground">
                          {section.teacherName || "No adviser assigned"}
                        </p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {grade >= 11 && (
                            <span>{section.strandLabel ?? "No strand"}</span>
                          )}
                          <span>Order: {section.sectionOrder}</span>
                          <span>
                            Enrollment: {section.enrollmentCount}
                            {" / "}
                            {section.capacity}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingSection(section);
                        }}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-input bg-white px-3 text-sm font-medium hover:bg-muted sm:self-auto"
                      >
                        <Pencil className="size-4" />
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
