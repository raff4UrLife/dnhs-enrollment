// src/lib/enrollment/application-files.ts
// Server-only: loads an application's uploaded files and signs temporary links.
// Call this only after the page has checked the user's role.
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_SECONDS = 60 * 60; // links last 1 hour; a page reload makes new ones

export type StoredFile = {
  path: string;
  url: string; // temporary signed link
  isPdf: boolean;
};

export type ApplicationStoredFiles = {
  photo: StoredFile | null;
  documents: Record<string, StoredFile>; // keyed by document_type_id
  error: string | null; // set if some files could not be loaded
};

const isPdfPath = (path: string) => path.toLowerCase().endsWith(".pdf");

export async function getApplicationFiles(
  applicationId: string,
  profilePicturePath: string | null,
): Promise<ApplicationStoredFiles> {
  const result: ApplicationStoredFiles = {
    photo: null,
    documents: {},
    error: null,
  };

  try {
    const admin = createAdminClient();

    // Profile picture
    if (profilePicturePath) {
      const { data, error } = await admin.storage
        .from("profile-pictures")
        .createSignedUrl(profilePicturePath, SIGNED_URL_SECONDS);
      if (error || !data) {
        console.error("[application-files] step=sign-photo", error);
        result.error = "Some files could not be loaded.";
      } else {
        result.photo = {
          path: profilePicturePath,
          url: data.signedUrl,
          isPdf: false,
        };
      }
    }

    // Documents
    const { data: rows, error: rowsErr } = await admin
      .from("application_documents")
      .select("document_type_id, file_url")
      .eq("application_id", applicationId);

    if (rowsErr) {
      console.error("[application-files] step=load-documents", rowsErr);
      result.error = "Some files could not be loaded.";
      return result;
    }

    const docRows = (rows ?? []).filter((r) => !!r.file_url);
    if (docRows.length === 0) return result;

    const { data: signed, error: signErr } = await admin.storage
      .from("documents")
      .createSignedUrls(
        docRows.map((r) => r.file_url as string),
        SIGNED_URL_SECONDS,
      );

    if (signErr || !signed) {
      console.error("[application-files] step=sign-documents", signErr);
      result.error = "Some files could not be loaded.";
      return result;
    }

    const urlByPath = new Map<string, string>();
    for (const item of signed) {
      if (item.error || !item.signedUrl || !item.path) {
        console.error(
          "[application-files] sign failed for",
          item.path,
          item.error,
        );
        result.error = "Some files could not be loaded.";
        continue;
      }
      urlByPath.set(item.path, item.signedUrl);
    }

    for (const row of docRows) {
      const path = row.file_url as string;
      const url = urlByPath.get(path);
      if (!url) continue;
      result.documents[row.document_type_id as string] = {
        path,
        url,
        isPdf: isPdfPath(path),
      };
    }

    return result;
  } catch (err) {
    console.error("[application-files] unexpected", err);
    result.error = "Some files could not be loaded.";
    return result;
  }
}
