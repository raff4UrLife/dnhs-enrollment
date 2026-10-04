// src/lib/enrollment/walk-in-flow.ts
import { approveApplication } from "@/app/admin/(portal)/applications/_lib/actions";
import { createWalkInDraft } from "@/app/admin/applications/walk-in-actions";
import { updateApplication } from "@/app/admin/(portal)/applications/[id]/actions";
import {
  uploadAdminFiles,
  type AdminUploadItem,
} from "@/lib/enrollment/admin-upload";
import type {
  ApplicationFiles,
  ApplicationFormData,
} from "@/lib/enrollment/types";

// What already happened, so pressing Save again continues instead of starting over
export type WalkInProgress = {
  applicationId: string | null; // the pending application, once it is saved
  uploaded: string[]; // "photo" or document type ids that are already uploaded
};

export const NEW_WALK_IN_PROGRESS: WalkInProgress = {
  applicationId: null,
  uploaded: [],
};

export type WalkInFlowResult =
  | { ok: true }
  | { ok: false; error: string; progress: WalkInProgress };

type Input = {
  data: ApplicationFormData;
  files: ApplicationFiles;
  documentNames: Record<string, string>; // document type id -> name, for messages
  progress: WalkInProgress;
};

function slotKey(item: AdminUploadItem): string {
  return item.slot.kind === "photo" ? "photo" : item.slot.documentTypeId;
}

/**
 * Walk-in Save & Enroll, in this order:
 * 1) save the application as pending (or refresh it on a retry),
 * 2) upload the photo and documents that were chosen,
 * 3) approve, which creates the learner, enrollment, section and email.
 * If a step fails, the pending application is kept and the returned progress
 * lets the next Save continue from where it stopped.
 */
export async function runWalkInFlow({
  data,
  files,
  documentNames,
  progress,
}: Input): Promise<WalkInFlowResult> {
  const fail = (error: string, p: WalkInProgress): WalkInFlowResult => ({
    ok: false,
    error,
    progress: p,
  });

  // 1) Save as pending the first time; on a retry, save the latest form edits
  let applicationId = progress.applicationId;
  if (!applicationId) {
    const draft = await createWalkInDraft(data);
    if (!draft.ok) return fail(draft.error, progress);
    applicationId = draft.id;
  } else {
    const updated = await updateApplication(applicationId, data);
    if (!updated.ok) return fail(updated.error, progress);
  }
  const uploaded = [...progress.uploaded];

  // 2) Upload the chosen files that are not uploaded yet
  const items: AdminUploadItem[] = [];
  if (files.profile_picture && !uploaded.includes("photo")) {
    items.push({
      slot: { kind: "photo" },
      label: "Profile picture",
      file: files.profile_picture,
    });
  }
  for (const [documentTypeId, file] of Object.entries(files.documents)) {
    if (!(file instanceof File) || uploaded.includes(documentTypeId)) continue;
    items.push({
      slot: { kind: "document", documentTypeId },
      label: documentNames[documentTypeId] ?? "Document",
      file,
    });
  }

  const failures = await uploadAdminFiles(applicationId, items);
  const failedLabels = new Set(failures.map((f) => f.label));
  for (const item of items) {
    if (!failedLabels.has(item.label)) uploaded.push(slotKey(item));
  }
  const current: WalkInProgress = { applicationId, uploaded };

  if (failures.length > 0) {
    const names = failures.map((f) => `${f.label} (${f.error})`).join("; ");
    return fail(
      `Saved as pending, but these files did not upload: ${names} Press Save & Enroll Student to try again.`,
      current,
    );
  }

  // 3) Approve: learner + section + enrollment + email
  const approved = await approveApplication(applicationId);
  if (!approved.ok) {
    return fail(
      `${approved.error} The application is saved as pending. Press Save & Enroll Student to try again.`,
      current,
    );
  }

  return { ok: true };
}
