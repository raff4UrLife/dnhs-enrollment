// src/lib/offline/queue.ts
import { offlineDb, type QueueRow } from "@/lib/offline/db";
import {
  NEW_WALK_IN_PROGRESS,
  type WalkInProgress,
} from "@/lib/enrollment/walk-in-flow";
import type {
  ApplicationFiles,
  ApplicationFormData,
} from "@/lib/enrollment/types";

type NewItem = {
  encoder: string;
  data: ApplicationFormData;
  files: ApplicationFiles;
  documentNames: Record<string, string>;
};

// Saves one walk-in on this computer. Tells the caller if it could not be saved,
// so the screen never says "saved" when it was not.
export async function addToQueue(
  item: NewItem,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const id = crypto.randomUUID();
  try {
    await offlineDb.queue.add({
      id,
      encoder: item.encoder,
      createdAt: Date.now(),
      status: "waiting",
      error: null,
      data: item.data,
      files: item.files,
      documentNames: item.documentNames,
      progress: NEW_WALK_IN_PROGRESS,
    });
    return { ok: true, id };
  } catch (error) {
    console.error("[offline] could not save to queue:", error);
    return {
      ok: false,
      error:
        "Could not save on this computer. The browser may be out of space or blocking storage.",
    };
  }
}

// Oldest first, the order they are sent in
export async function listQueue(): Promise<QueueRow[]> {
  try {
    return await offlineDb.queue.orderBy("createdAt").toArray();
  } catch (error) {
    console.error("[offline] could not read queue:", error);
    return [];
  }
}

// Used after a send attempt: keeps the progress, and the reason it was refused
export async function updateQueueItem(
  id: string,
  patch: {
    status?: "waiting" | "needs-attention";
    error?: string | null;
    progress?: WalkInProgress;
    data?: ApplicationFormData;
  },
): Promise<void> {
  try {
    await offlineDb.queue.update(id, patch);
  } catch (error) {
    console.error("[offline] could not update queue item:", id, error);
  }
}

// Called only after the server confirmed the walk-in, or when staff delete an item
export async function removeFromQueue(id: string): Promise<void> {
  try {
    await offlineDb.queue.delete(id);
  } catch (error) {
    console.error("[offline] could not remove queue item:", id, error);
  }
}

export async function countQueue(): Promise<number> {
  try {
    return await offlineDb.queue.count();
  } catch {
    return 0;
  }
}
