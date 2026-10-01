// src/lib/enrollment/upload-files.ts
import { createClient } from "@/lib/supabase/client";
import {
  createUploadUrls,
  finalizeUploads,
} from "@/app/enrollment-form/upload-actions";
import type { ApplicationFiles } from "@/lib/enrollment/types";

export type UploadSummary =
  | {
      ok: true;
      profilePicture: boolean; // saved on the server
      documents: number; // how many documents were saved
      failedKeys: string[]; // "profile" or a document type id that did not upload
      rejected: string[]; // files the server removed (over the size limit)
    }
  | { ok: false; error: string };

export async function uploadApplicationFiles(
  applicationId: string,
  files: ApplicationFiles,
): Promise<UploadSummary> {
  try {
    const documents = Object.entries(files.documents).filter(
      (entry): entry is [string, File] => entry[1] instanceof File,
    );

    // Nothing selected: nothing to do
    if (!files.profile_picture && documents.length === 0) {
      return {
        ok: true,
        profilePicture: false,
        documents: 0,
        failedKeys: [],
        rejected: [],
      };
    }

    // 1) Ask the server for upload links (it checks type, size, and the application)
    const linksResult = await createUploadUrls(applicationId, {
      profilePicture: files.profile_picture
        ? { type: files.profile_picture.type, size: files.profile_picture.size }
        : null,
      documents: documents.map(([documentTypeId, file]) => ({
        documentTypeId,
        type: file.type,
        size: file.size,
      })),
    });
    if (!linksResult.ok) return { ok: false, error: linksResult.error };

    // 2) Send each file straight to Supabase Storage
    const supabase = createClient();
    const fileByKey = new Map<string, File>(documents);
    if (files.profile_picture) fileByKey.set("profile", files.profile_picture);

    const failedKeys: string[] = [];
    await Promise.all(
      linksResult.uploads.map(async (link) => {
        const file = fileByKey.get(link.key);
        if (!file) {
          failedKeys.push(link.key);
          return;
        }
        const { error } = await supabase.storage
          .from(link.bucket)
          .uploadToSignedUrl(link.path, link.token, file, {
            contentType: file.type,
          });
        if (error) {
          console.error("[upload-files] upload failed", link.key, error);
          failedKeys.push(link.key);
        }
      }),
    );

    // 3) Let the server check what landed and record it in the database
    const finalResult = await finalizeUploads(applicationId);
    if (!finalResult.ok) return { ok: false, error: finalResult.error };

    return {
      ok: true,
      profilePicture: finalResult.profilePicture,
      documents: finalResult.documents,
      failedKeys,
      rejected: finalResult.rejected,
    };
  } catch (err) {
    console.error("[upload-files] unexpected", err);
    return {
      ok: false,
      error: "Something went wrong while uploading your files.",
    };
  }
}
