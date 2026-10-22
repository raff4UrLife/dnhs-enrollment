// src/app/admin/(portal)/manage-sections/manage-sections.tsx
"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import SectionForm from "@/components/sections/section-form";
import { deleteSection } from "./actions";
import type { ManageSection, ManageStrand } from "@/lib/sections/manage-data";

type SchoolYearOption = { id: string; label: string };

type Props = {
  schoolYears: SchoolYearOption[];
  schoolYearId: string;
  sections: ManageSection[];
  strands: ManageStrand[];
};

const buttonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-white px-3 text-sm font-medium hover:bg-muted disabled:opacity-60";

export default function ManageSections({
  schoolYears,
  schoolYearId,
  sections,
  strands,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // null = form closed, "new" = adding, a section = editing it
  const [editing, setEditing] = useState<ManageSection | "new" | null>(null);
  const [toDelete, setToDelete] = useState<ManageSection | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const strandName = (id: string | null) =>
    id ? (strands.find((s) => s.id === id)?.name ?? "—") : "—";

  function changeYear(id: string) {
    setEditing(null);
    router.push(`${pathname}?schoolyear=${id}`);
  }

  function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteSection(toDelete.id);
      if (result.ok) {
        setToDelete(null);
      } else {
        setDeleteError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          School year
          <select
            value={schoolYearId}
            onChange={(e) => changeYear(e.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            {schoolYears.map((sy) => (
              <option key={sy.id} value={sy.id}>
                {sy.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Section
        </button>
      </div>

      {editing && (
        <SectionForm
          // key resets the form's state when switching between sections
          key={editing === "new" ? "new" : editing.id}
          schoolYearId={schoolYearId}
          strands={strands}
          section={editing === "new" ? undefined : editing}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="overflow-x-auto rounded-md border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Grade</th>
              <th className="px-3 py-2 font-medium">Strand</th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Section</th>
              <th className="px-3 py-2 font-medium">Adviser</th>
              <th className="px-3 py-2 font-medium">Learners</th>
              <th className="px-3 py-2 font-medium">Over capacity</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No sections for this school year yet.
                </td>
              </tr>
            )}
            {sections.map((s) => {
              const over = Math.max(0, s.enrollmentCount - s.capacity);
              return (
                <tr key={s.id} className="border-t border-black/10">
                  <td className="px-3 py-2">Grade {s.gradeLevel}</td>
                  <td className="px-3 py-2">{strandName(s.strandId)}</td>
                  <td className="px-3 py-2">{s.sectionOrder}</td>
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">{s.teacherName}</td>
                  <td className="px-3 py-2">
                    {s.enrollmentCount} / {s.capacity}
                  </td>
                  <td className="px-3 py-2">
                    {over > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                        <AlertTriangle className="size-3.5" />
                        {over}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setEditing(s)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => {
                          setDeleteError(null);
                          setToDelete(s);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isDeleting && setToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-md bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-lg font-semibold">
              Delete {toDelete.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Grade {toDelete.gradeLevel}
              {toDelete.strandId ? `, ${strandName(toDelete.strandId)}` : ""}.
              {toDelete.enrollmentCount > 0 &&
                ` It has ${toDelete.enrollmentCount} enrolled learner(s), so the delete may be refused.`}
            </p>
            {deleteError && (
              <p
                role="alert"
                className="mt-3 text-sm font-medium text-destructive"
              >
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={buttonClass}
                disabled={isDeleting}
                onClick={() => setToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="size-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
