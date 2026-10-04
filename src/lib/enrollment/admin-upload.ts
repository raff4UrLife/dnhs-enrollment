// src/lib/enrollment/admin-upload.ts
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/enrollment/compress-image";
import { IMAGE_TYPES } from "@/lib/enrollment/validate-file";
import {
  createAdminUploadTarget,
  finishAdminUpload,
  type SlotRef,
} from "@/app/admin/(portal)/applications/[id]/file-actions";

export type AdminUploadResult = { ok: true } | { ok: false; error: string };

// Uploads one file into a photo or document slot of a PENDING application.
// 1) ask the server for a signed link, 2) send the file to storage,
// 3) let the server record it.
export async function uploadAdminFile(
  applicationId: string,
  slot: SlotRef,
  picked: File,
): Promise<AdminUploadResult> {
  try {
    // Images are compressed; PDFs (scanner output) go through as they are
    let file = picked;
    if ((IMAGE_TYPES as readonly string[]).includes(picked.type)) {
      file = await compressImage(picked);
    }

    const target = await createAdminUploadTarget(applicationId, slot, {
      type: file.type,
      size: file.size,
    });
    if (!target.ok) return { ok: false, error: target.error };

    const { bucket, path, token, ext } = target.target;
    const { error } = await createClient()
      .storage.from(bucket)
      .uploadToSignedUrl(path, token, file, { contentType: file.type });
    if (error) {
      console.error("[admin-upload] upload failed", path, error);
      return { ok: false, error: "The upload failed. Please try again." };
    }

    const done = await finishAdminUpload(applicationId, slot, ext);
    if (!done.ok) return { ok: false, error: done.error };

    return { ok: true };
  } catch (err) {
    console.error("[admin-upload] unexpected", err);
    return {
      ok: false,
      error: "Could not process that file. Try another one.",
    };
  }
}

export type AdminUploadItem = { slot: SlotRef; label: string; file: File };
export type AdminUploadFailure = { label: string; error: string };

// Uploads several files one after another (not at once, because the server
// checks the application's total size after each file).
// Returns the files that failed; an empty list means everything uploaded.
export async function uploadAdminFiles(
  applicationId: string,
  items: AdminUploadItem[],
): Promise<AdminUploadFailure[]> {
  const failures: AdminUploadFailure[] = [];
  for (const item of items) {
    const result = await uploadAdminFile(applicationId, item.slot, item.file);
    if (!result.ok) failures.push({ label: item.label, error: result.error });
  }
  return failures;
}
