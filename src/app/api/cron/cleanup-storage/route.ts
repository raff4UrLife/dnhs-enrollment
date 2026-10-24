// src/app/api/cron/cleanup-storage/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createAdminClient>;
type Entry = { name: string; id: string | null; created_at: string | null };

const ROOT = "applications";
const PAGE = 1000;
const CHUNK = 100;
const MIN_AGE_MS = 24 * 60 * 60 * 1000; // never touch files newer than 1 day

// Every file or folder directly inside one path, page by page
async function listAll(
  admin: Admin,
  bucket: string,
  path: string,
): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(path, { limit: PAGE, offset });
    if (error) throw error;
    out.push(...(data as Entry[]));
    if (data.length < PAGE) break;
  }
  return out;
}

function isOldEnough(createdAt: string | null): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > MIN_AGE_MS;
}

// application id -> storage paths of its old files, for both buckets
async function collect(admin: Admin) {
  const photos = new Map<string, string[]>();
  const docs = new Map<string, string[]>();

  // profile-pictures: applications/<application_id>.jpg
  for (const f of await listAll(admin, "profile-pictures", ROOT)) {
    if (f.id === null || !isOldEnough(f.created_at)) continue;
    const appId = f.name.replace(/\.[^.]+$/, "");
    photos.set(appId, [...(photos.get(appId) ?? []), `${ROOT}/${f.name}`]);
  }

  // documents: applications/<application_id>/<document_type_id>.pdf
  for (const folder of await listAll(admin, "documents", ROOT)) {
    if (folder.id !== null) continue; // folders have no id
    const inside = await listAll(admin, "documents", `${ROOT}/${folder.name}`);
    const paths = inside
      .filter((f) => f.id !== null && isOldEnough(f.created_at))
      .map((f) => `${ROOT}/${folder.name}/${f.name}`);
    if (paths.length > 0) docs.set(folder.name, paths);
  }

  return { photos, docs };
}

// Which of these application ids still exist in the database
async function existingIds(admin: Admin, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await admin
      .from("applications")
      .select("id")
      .in("id", ids.slice(i, i + CHUNK));
    if (error) throw error;
    for (const row of data ?? []) found.add(row.id);
  }
  return found;
}

async function removeFiles(admin: Admin, bucket: string, paths: string[]) {
  for (let i = 0; i < paths.length; i += CHUNK) {
    const { error } = await admin.storage
      .from(bucket)
      .remove(paths.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";

  try {
    const admin = createAdminClient();
    const { photos, docs } = await collect(admin);

    const allIds = [...new Set([...photos.keys(), ...docs.keys()])];
    const alive = await existingIds(admin, allIds);

    // Orphans = files whose application row is gone
    const photoPaths = [...photos]
      .filter(([id]) => !alive.has(id))
      .flatMap(([, paths]) => paths);
    const docPaths = [...docs]
      .filter(([id]) => !alive.has(id))
      .flatMap(([, paths]) => paths);

    if (!dry) {
      await removeFiles(admin, "profile-pictures", photoPaths);
      await removeFiles(admin, "documents", docPaths);
    }

    return NextResponse.json({
      dry,
      deletedPhotos: photoPaths.length,
      deletedDocuments: docPaths.length,
      ...(dry ? { photoPaths, docPaths } : {}),
    });
  } catch (err) {
    console.error("[cron/cleanup-storage]", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
