// src/app/enrollment-form/upload-actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 1024 * 1024; // 1 MB per file for public applicants
const TOTAL_MAX_BYTES = 4 * 1024 * 1024; // 4 MB per application for public applicants
const UPLOAD_WINDOW_MS = 30 * 60 * 1000; // uploads allowed for 30 minutes after submitting

// Profile picture: images only
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// Documents: images or PDF (scanner output is PDF)
const DOC_EXT: Record<string, string> = {
  ...IMAGE_EXT,
  "application/pdf": "pdf",
};
const IMAGE_EXTS = Object.values(IMAGE_EXT);
const DOC_EXTS = Object.values(DOC_EXT);

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

type AdminClient = ReturnType<typeof createAdminClient>;

// Only a freshly submitted, still-pending online application may receive files.
async function checkOpenApplication(
  admin: AdminClient,
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

// The slot keeps one fixed path. If the new file has a different extension,
// remove the old variants first so no orphan file is left behind.
async function removeOtherVariants(
  admin: AdminClient,
  bucket: "profile-pictures" | "documents",
  basePath: string,
  keepExt: string,
  allExts: string[],
): Promise<boolean> {
  const stale = allExts
    .filter((e) => e !== keepExt)
    .map((e) => `${basePath}.${e}`);
  if (stale.length === 0) return true;
  const { error } = await admin.storage.from(bucket).remove(stale);
  if (error) {
    console.error(
      "[uploads] step=remove-old-variants",
      bucket,
      basePath,
      error,
    );
    return false;
  }
  return true;
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

    const checkSize = (meta: FileMeta): string | null => {
      if (
        !Number.isFinite(meta.size) ||
        meta.size <= 0 ||
        meta.size > MAX_BYTES
      ) {
        return "Each file must be 1 MB or smaller.";
      }
      return null;
    };

    const docs = files.documents ?? [];
    if (docs.length > 10) return { ok: false, error: "Too many files." };

    // Total size for the whole application
    const totalSize =
      (files.profilePicture?.size ?? 0) +
      docs.reduce((sum, d) => sum + (Number.isFinite(d.size) ? d.size : 0), 0);
    if (totalSize > TOTAL_MAX_BYTES) {
      return { ok: false, error: "Total upload size must be 4 MB or smaller." };
    }

    const uploads: UploadLink[] = [];

    // Profile picture (images only)
    if (files.profilePicture) {
      const meta = files.profilePicture;
      if (!IMAGE_EXT[meta.type]) {
        return {
          ok: false,
          error: "The profile picture must be a JPG, PNG, or WebP image.",
        };
      }
      const sizeProblem = checkSize(meta);
      if (sizeProblem) return { ok: false, error: sizeProblem };

      const ext = IMAGE_EXT[meta.type];
      const base = `applications/${applicationId}`;

      const cleaned = await removeOtherVariants(
        admin,
        "profile-pictures",
        base,
        ext,
        IMAGE_EXTS,
      );
      if (!cleaned) {
        return { ok: false, error: "Could not prepare the photo upload." };
      }

      const path = `${base}.${ext}`;
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

    // Documents (images or PDF)
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
      if (!DOC_EXT[doc.type]) {
        return {
          ok: false,
          error: "Documents must be a JPG, PNG, WebP image, or a PDF.",
        };
      }
      const sizeProblem = checkSize(doc);
      if (sizeProblem) return { ok: false, error: sizeProblem };

      const ext = DOC_EXT[doc.type];
      const base = `applications/${applicationId}/${doc.documentTypeId}`;

      const cleaned = await removeOtherVariants(
        admin,
        "documents",
        base,
        ext,
        DOC_EXTS,
      );
      if (!cleaned) {
        return { ok: false, error: "Could not prepare a document upload." };
      }

      const path = `${base}.${ext}`;
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
        const mime = pic.metadata?.mimetype as string | undefined;
        if (size > MAX_BYTES || (mime && !IMAGE_EXT[mime])) {
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
      const mime = file.metadata?.mimetype as string | undefined;
      if (size > MAX_BYTES || (mime && !DOC_EXT[mime])) {
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
