// src/app/admin/(portal)/applications/[id]/file-actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff } from "@/lib/auth/require-role";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PHOTO_MAX_BYTES = 2 * 1024 * 1024; // profile-pictures bucket limit
const DOC_MAX_BYTES = 5 * 1024 * 1024; // documents bucket limit
const TOTAL_MAX_BYTES = 10 * 1024 * 1024; // storage budget per student

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const DOC_EXT: Record<string, string> = {
  ...IMAGE_EXT,
  "application/pdf": "pdf",
};

export type SlotRef =
  | { kind: "photo" }
  | { kind: "document"; documentTypeId: string };

export type UploadTarget = {
  bucket: "profile-pictures" | "documents";
  path: string;
  token: string;
  ext: string;
};

export type CreateTargetResult =
  | { ok: true; target: UploadTarget }
  | { ok: false; error: string };

export type FinishResult = { ok: true } | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

type SlotInfo = {
  bucket: "profile-pictures" | "documents";
  folder: string; // where the file lives in the bucket
  stem: string; // file name without extension
  maxBytes: number;
  mimeToExt: Record<string, string>;
};

function slotInfo(applicationId: string, slot: SlotRef): SlotInfo {
  if (slot.kind === "photo") {
    return {
      bucket: "profile-pictures",
      folder: "applications",
      stem: applicationId,
      maxBytes: PHOTO_MAX_BYTES,
      mimeToExt: IMAGE_EXT,
    };
  }
  return {
    bucket: "documents",
    folder: `applications/${applicationId}`,
    stem: slot.documentTypeId,
    maxBytes: DOC_MAX_BYTES,
    mimeToExt: DOC_EXT,
  };
}

// Only admin and staff may change files, and only while the application is pending.
async function checkAccess(
  admin: AdminClient,
  applicationId: string,
  slot: SlotRef,
): Promise<string | null> {
  const staff = await getCurrentStaff();
  if (!staff) return "Please log in again.";
  if (staff.role !== "admin" && staff.role !== "staff") {
    return "You do not have permission to change files.";
  }
  if (!UUID_RE.test(applicationId)) return "Invalid application.";

  const { data: app, error } = await admin
    .from("applications")
    .select("id, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("[file-actions] step=check-application", error);
    return "Could not verify the application.";
  }
  if (!app) return "Application not found.";
  if (app.status !== "pending") {
    return "Approved applications can no longer be edited.";
  }

  if (slot.kind === "document") {
    if (!UUID_RE.test(slot.documentTypeId)) return "Unknown document type.";
    const { data: type, error: typeErr } = await admin
      .from("document_types")
      .select("id")
      .eq("id", slot.documentTypeId)
      .maybeSingle();
    if (typeErr) {
      console.error("[file-actions] step=check-document-type", typeErr);
      return "Could not verify the document type.";
    }
    if (!type) return "Unknown document type.";
  }
  return null;
}

type StoredItem = { name: string; size: number };

async function listFolder(
  admin: AdminClient,
  info: SlotInfo,
  search?: string,
): Promise<StoredItem[]> {
  const { data, error } = await admin.storage
    .from(info.bucket)
    .list(info.folder, search ? { search } : undefined);
  if (error) {
    console.error("[file-actions] step=list", info.bucket, info.folder, error);
    throw new Error("list-failed");
  }
  return (data ?? []).map((f) => ({
    name: f.name,
    size: Number(f.metadata?.size ?? 0),
  }));
}

// Bytes already used by this application, not counting the slot being replaced
async function usedBytesExcludingSlot(
  admin: AdminClient,
  applicationId: string,
  slot: SlotRef,
): Promise<number> {
  const photoInfo = slotInfo(applicationId, { kind: "photo" });
  const docsInfo = slotInfo(applicationId, {
    kind: "document",
    documentTypeId: "00000000-0000-0000-0000-000000000000",
  });

  const photoFiles = (await listFolder(admin, photoInfo, applicationId)).filter(
    (f) => f.name.startsWith(`${applicationId}.`),
  );
  const docFiles = await listFolder(admin, docsInfo);

  const currentStem =
    slot.kind === "photo" ? applicationId : slot.documentTypeId;

  let total = 0;
  if (slot.kind !== "photo") {
    total += photoFiles.reduce((sum, f) => sum + f.size, 0);
  }
  total += docFiles
    .filter(
      (f) => slot.kind === "photo" || !f.name.startsWith(`${currentStem}.`),
    )
    .reduce((sum, f) => sum + f.size, 0);
  return total;
}

// Step 1: check the rules, then hand back a signed upload link for the slot's fixed path.
export async function createAdminUploadTarget(
  applicationId: string,
  slot: SlotRef,
  file: { type: string; size: number },
): Promise<CreateTargetResult> {
  try {
    const admin = createAdminClient();

    const blocked = await checkAccess(admin, applicationId, slot);
    if (blocked) return { ok: false, error: blocked };

    const info = slotInfo(applicationId, slot);
    const ext = info.mimeToExt[file.type];
    if (!ext) {
      return {
        ok: false,
        error:
          slot.kind === "photo"
            ? "The photo must be a JPG, PNG, or WebP image."
            : "Documents must be a JPG, PNG, WebP image, or a PDF.",
      };
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      return { ok: false, error: "That file is empty." };
    }
    if (file.size > info.maxBytes) {
      const mb = info.maxBytes / (1024 * 1024);
      return { ok: false, error: `The file must be ${mb} MB or smaller.` };
    }

    const used = await usedBytesExcludingSlot(admin, applicationId, slot);
    if (used + file.size > TOTAL_MAX_BYTES) {
      return {
        ok: false,
        error: "This application's files would go over the 10 MB limit.",
      };
    }

    const path = `${info.folder}/${info.stem}.${ext}`;
    const { data, error } = await admin.storage
      .from(info.bucket)
      .createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      console.error("[file-actions] step=sign-upload", error);
      return { ok: false, error: "Could not prepare the upload." };
    }

    return {
      ok: true,
      target: { bucket: info.bucket, path, token: data.token, ext },
    };
  } catch (err) {
    console.error("[file-actions] createAdminUploadTarget unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// Step 2: after the browser uploaded, confirm the file landed, remove any older copy
// with a different extension, and record the new path in the database.
export async function finishAdminUpload(
  applicationId: string,
  slot: SlotRef,
  ext: string,
): Promise<FinishResult> {
  try {
    const admin = createAdminClient();

    const blocked = await checkAccess(admin, applicationId, slot);
    if (blocked) return { ok: false, error: blocked };

    const info = slotInfo(applicationId, slot);
    if (!Object.values(info.mimeToExt).includes(ext)) {
      return { ok: false, error: "Invalid file type." };
    }

    const items = (await listFolder(admin, info, info.stem)).filter((f) =>
      f.name.startsWith(`${info.stem}.`),
    );
    const newName = `${info.stem}.${ext}`;
    const landed = items.find((f) => f.name === newName);
    if (!landed) {
      return {
        ok: false,
        error: "The upload did not finish. Please try again.",
      };
    }
    if (landed.size > info.maxBytes) {
      await admin.storage
        .from(info.bucket)
        .remove([`${info.folder}/${newName}`]);
      return { ok: false, error: "The uploaded file is too large." };
    }

    // Remove older copies saved under a different extension
    const stale = items
      .filter((f) => f.name !== newName)
      .map((f) => `${info.folder}/${f.name}`);
    if (stale.length > 0) {
      const { error: rmErr } = await admin.storage
        .from(info.bucket)
        .remove(stale);
      if (rmErr) console.error("[file-actions] step=remove-old", rmErr);
    }

    const path = `${info.folder}/${newName}`;

    if (slot.kind === "photo") {
      const { error } = await admin
        .from("applications")
        .update({ profile_picture_url: path })
        .eq("id", applicationId);
      if (error) {
        console.error("[file-actions] step=save-photo", error);
        return { ok: false, error: "Could not save the photo." };
      }
    } else {
      const { error: delErr } = await admin
        .from("application_documents")
        .delete()
        .eq("application_id", applicationId)
        .eq("document_type_id", slot.documentTypeId);
      if (delErr) {
        console.error("[file-actions] step=clear-document", delErr);
        return { ok: false, error: "Could not save the document." };
      }
      const { error: insErr } = await admin
        .from("application_documents")
        .insert({
          application_id: applicationId,
          document_type_id: slot.documentTypeId,
          file_url: path,
        });
      if (insErr) {
        console.error("[file-actions] step=save-document", insErr);
        return { ok: false, error: "Could not save the document." };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("[file-actions] finishAdminUpload unexpected", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
