// src/components/sections/manage-sections.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { ManageData, ManageSection } from "@/lib/sections/manage-data";
import SectionForm from "@/components/sections/section-form";
import { deleteSection } from "@/app/admin/(portal)/manage-sections/actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  data: ManageData;
};

const outlineButton =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-white/30 bg-transparent px-3 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function ManageSections({ data }: Props) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<ManageSection | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  // Delete confirmation happens inside the row, no popup.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function closeForm() {
    setShowForm(false);
    setEditingSection(null);
  }

  function handleDone() {
    closeForm();
    router.refresh();
  }

  function startConfirm(section: ManageSection) {
    setDeleteError(null);
    setConfirmingId(section.id);
  }

  function cancelConfirm() {
    setConfirmingId(null);
    setDeleteError(null);
  }

  function confirmDelete(section: ManageSection) {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteSection(section.id);
      if (result.ok) {
        setConfirmingId(null);
        if (editingSection?.id === section.id) closeForm();
        router.refresh();
      } else {
        setDeleteError(result.error);
      }
    });
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

      <Dialog
        open={showForm || editingSection !== null}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent showCloseButton={false}>
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
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {grades.length === 0 ? (
          <div className="rounded-lg bg-secondary px-4 py-10 text-center text-white">
            <p className="text-sm font-medium">No sections found</p>
            <p className="mt-1 text-sm text-white/60">
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
                className="overflow-hidden rounded-lg bg-secondary text-white"
              >
                <div className="border-b border-white/15 px-4 py-3">
                  <h2 className="font-semibold text-white">Grade {grade}</h2>
                  <p className="mt-0.5 text-sm text-white/60">
                    {sections.length} section
                    {sections.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="divide-y divide-white/15">
                  {sections.map((section) => {
                    const over = Math.max(
                      0,
                      section.enrollmentCount - section.capacity,
                    );
                    const hasLearners = section.enrollmentCount > 0;
                    const isConfirming = confirmingId === section.id;

                    return (
                      <div
                        key={section.id}
                        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-medium text-white">
                            {section.name}
                          </h3>

                          <p className="text-sm text-white/80">
                            {section.teacherName || "No adviser assigned"}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                            {grade >= 11 && (
                              <span>{section.strandLabel ?? "No strand"}</span>
                            )}
                            <span>Order: {section.sectionOrder}</span>
                            <span>
                              Enrollment: {section.enrollmentCount}
                              {" / "}
                              {section.capacity}
                            </span>
                            {over > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-amber-300">
                                <AlertTriangle className="size-3.5" />
                                Over capacity by {over}
                              </span>
                            )}
                          </div>
                        </div>

                        {isConfirming ? (
                          <div className="space-y-2 sm:max-w-xs sm:text-right">
                            <p className="text-sm font-medium text-white">
                              Delete {section.name}?
                            </p>
                            {deleteError && (
                              <p
                                role="alert"
                                className="text-sm font-medium text-red-300"
                              >
                                {deleteError}
                              </p>
                            )}
                            <div className="flex gap-2 sm:justify-end">
                              <button
                                type="button"
                                className={outlineButton}
                                disabled={isDeleting}
                                onClick={cancelConfirm}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => confirmDelete(section)}
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-destructive px-3 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-60"
                              >
                                {isDeleting && (
                                  <Loader2 className="size-4 animate-spin" />
                                )}
                                Yes, delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                cancelConfirm();
                                setShowForm(false);
                                setEditingSection(section);
                              }}
                              className={outlineButton}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={hasLearners || isDeleting}
                              title={
                                hasLearners
                                  ? "Move the learners to another section first"
                                  : undefined
                              }
                              onClick={() => startConfirm(section)}
                              className={outlineButton}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
