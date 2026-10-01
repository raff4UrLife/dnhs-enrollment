// src/app/enrollment-form/upload-actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 1024 * 1024; // 1 MB per file for public applicants
const UPLOAD_WINDOW_MS = 30 * 60 * 1000; // uploads allowed for 30 minutes after submitting
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FileMeta = { type: string; size: number };

export type UploadLink = {
  key: string; // "profile" or a document type id
  bucket: "profile-pictures" | "documents";
  path: string;
  token: string;
};

export type CreateLinksResult =
  | { ok: true; uploads: UploadLink[] }
  | { ok: false; error: string };

export type FinalizeResult =
  | { ok: true; profilePicture: boolean; documents: number; rejected: string[] }
  | { ok: false; error: string };

// Only a freshly submitted, still-pending online application may receive files.
async function checkOpenApplication(
  admin: ReturnType<typeof createAdminClient>,
  applicationId: string,
): Promise<string | null> {
  if (!UUID_RE.test(applicationId)) return "Invalid application.";

  const { data: app, error } = await admin
    .from("applications")
    .select("id, channel, status, created_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[uploads] step=check-application", error);
    return "Could not verify the application.";
  }
  if (!app || app.channel !== "online" || app.status !== "pending")
    return "Application not found.";
  if (Date.now() - new Date(app.created_at).getTime() > UPLOAD_WINDOW_MS) {
    return "The upload window has closed. Please bring your documents to the school.";
  }
  return null;
}

export async function createUploadUrls(
  applicationId: string,
  files: {
    profilePicture?: FileMeta | null;
    documents: (FileMeta & { documentTypeId: string })[];
  },
): Promise<CreateLinksResult> {
  try {
    const admin = createAdminClient();

    const blocked = await checkOpenApplication(admin, applicationId);
    if (blocked) return { ok: false, error: blocked };

    const checkMeta = (meta: FileMeta): string | null => {
      if (!IMAGE_EXT[meta.type])
        return "Only JPG, PNG, or WebP images are allowed.";
      if (
        !Number.isFinite(meta.size) ||
        meta.size <= 0 ||
        meta.size > MAX_BYTES
      ) {
        return "Each file must be 1 MB or smaller.";
      }
      return null;
    };

    const uploads: UploadLink[] = [];

    // Profile picture
    if (files.profilePicture) {
      const problem = checkMeta(files.profilePicture);
      if (problem) return { ok: false, error: problem };

      const path = `applications/${applicationId}.${IMAGE_EXT[files.profilePicture.type]}`;
      const { data, error } = await admin.storage
        .from("profile-pictures")
        .createSignedUploadUrl(path, { upsert: true });
      if (error || !data) {
        console.error("[uploads] step=sign-profile", error);
        return { ok: false, error: "Could not prepare the photo upload." };
      }
      uploads.push({
        key: "profile",
        bucket: "profile-pictures",
        path,
        token: data.token,
      });
    }

    // Documents
    const docs = files.documents ?? [];
    if (docs.length > 10) return { ok: false, error: "Too many files." };

    const ids = docs.map((d) => d.documentTypeId);
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !UUID_RE.test(id))
    ) {
      return { ok: false, error: "Invalid document list." };
    }

    if (ids.length > 0) {
      const { data: validTypes, error: typeErr } = await admin
        .from("document_types")
        .select("id")
        .in("id", ids);
      if (typeErr) {
        console.error("[uploads] step=document-types", typeErr);
        return { ok: false, error: "Could not verify the document types." };
      }
      if ((validTypes ?? []).length !== ids.length) {
        return { ok: false, error: "Unknown document type." };
      }
    }

    for (const doc of docs) {
      const problem = checkMeta(doc);
      if (problem) return { ok: false, error: problem };

      const path = `applications/${applicationId}/${doc.documentTypeId}.${IMAGE_EXT[doc.type]}`;
      const { data, error } = await admin.storage
        .from("documents")
        .createSignedUploadUrl(path, { upsert: true });
      if (error || !data) {
        console.error(
          "[uploads] step=sign-document",
          doc.documentTypeId,
          error,
        );
        return { ok: false, error: "Could not prepare a document upload." };
      }
      uploads.push({
        key: doc.documentTypeId,
        bucket: "documents",
        path,
        token: data.token,
      });
    }

    return { ok: true, uploads };
  } catch (err) {
    console.error("[uploads] createUploadUrls unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// Call after the browser finishes uploading. Checks what really landed in storage,
// then records it in the database (paths, not public URLs).
export async function finalizeUploads(
  applicationId: string,
): Promise<FinalizeResult> {
  try {
    const admin = createAdminClient();

    const blocked = await checkOpenApplication(admin, applicationId);
    if (blocked) return { ok: false, error: blocked };

    const rejected: string[] = [];

    // Profile picture
    let profilePath: string | null = null;
    const { data: pics, error: picErr } = await admin.storage
      .from("profile-pictures")
      .list("applications", { search: applicationId });
    if (picErr) {
      console.error("[uploads] step=list-profile", picErr);
    } else {
      const pic = (pics ?? []).find((f) =>
        f.name.startsWith(`${applicationId}.`),
      );
      if (pic) {
        const path = `applications/${pic.name}`;
        const size = Number(pic.metadata?.size ?? 0);
        if (size > MAX_BYTES) {
          await admin.storage.from("profile-pictures").remove([path]);
          rejected.push("profile picture");
        } else {
          profilePath = path;
        }
      }
    }

    // Documents
    const { data: docFiles, error: docErr } = await admin.storage
      .from("documents")
      .list(`applications/${applicationId}`);
    if (docErr) console.error("[uploads] step=list-documents", docErr);

    const docRows: {
      application_id: string;
      document_type_id: string;
      file_url: string;
    }[] = [];
    const seen = new Set<string>();

    for (const file of docFiles ?? []) {
      const typeId = file.name.split(".")[0];
      if (!UUID_RE.test(typeId) || seen.has(typeId)) continue;

      const path = `applications/${applicationId}/${file.name}`;
      const size = Number(file.metadata?.size ?? 0);
      if (size > MAX_BYTES) {
        await admin.storage.from("documents").remove([path]);
        rejected.push(file.name);
        continue;
      }
      seen.add(typeId);
      docRows.push({
        application_id: applicationId,
        document_type_id: typeId,
        file_url: path,
      });
    }

    // Record in the database (delete + insert so retries never duplicate)
    if (docRows.length > 0) {
      const { error: delErr } = await admin
        .from("application_documents")
        .delete()
        .eq("application_id", applicationId);
      if (delErr) {
        console.error("[uploads] step=clear-documents", delErr);
        return { ok: false, error: "Could not save the documents." };
      }
      const { error: insErr } = await admin
        .from("application_documents")
        .insert(docRows);
      if (insErr) {
        console.error("[uploads] step=insert-documents", insErr);
        return { ok: false, error: "Could not save the documents." };
      }
    }

    if (profilePath) {
      const { error: updErr } = await admin
        .from("applications")
        .update({ profile_picture_url: profilePath })
        .eq("id", applicationId);
      if (updErr) {
        console.error("[uploads] step=save-profile", updErr);
        return { ok: false, error: "Could not save the profile picture." };
      }
    }

    return {
      ok: true,
      profilePicture: !!profilePath,
      documents: docRows.length,
      rejected,
    };
  } catch (err) {
    console.error("[uploads] finalizeUploads unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
