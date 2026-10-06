// src/lib/offline/db.ts
import Dexie, { type Table } from "dexie";
import type {
  ApplicationFiles,
  ApplicationFormData,
} from "@/lib/enrollment/types";
import type { WalkInProgress } from "@/lib/enrollment/walk-in-flow";

// One row per cached chunk of data, e.g. key "reference-data".
export type CacheRow = {
  key: string;
  value: unknown;
  savedAt: number; // Date.now() when it was saved, for "offline data as of ..."
};

// One row per walk-in encoded offline, waiting to be sent to the server.
export type QueueRow = {
  id: string; // made on this computer (crypto.randomUUID())
  encoder: string; // name of the person who encoded it
  createdAt: number;
  status: "waiting" | "needs-attention";
  error: string | null; // why the server refused it, shown to the user
  data: ApplicationFormData;
  files: ApplicationFiles; // File objects can be stored in IndexedDB directly
  documentNames: Record<string, string>; // document type id -> name, for messages
  progress: WalkInProgress; // lets a half-finished send continue where it stopped
};

class OfflineDb extends Dexie {
  cache!: Table<CacheRow, string>;
  queue!: Table<QueueRow, string>;

  constructor() {
    super("dnhs-offline");
    this.version(1).stores({ cache: "key" });
    // Version 2 adds the queue. Existing cache rows are kept.
    this.version(2).stores({ cache: "key", queue: "id, createdAt" });
  }
}

export const offlineDb = new OfflineDb();

// // src/lib/offline/db.ts
// import Dexie, { type Table } from "dexie";

// // One row per cached chunk of data, e.g. key "reference-data".
// export type CacheRow = {
//   key: string;
//   value: unknown;
//   savedAt: number; // Date.now() when it was saved, for "offline data as of ..."
// };

// class OfflineDb extends Dexie {
//   cache!: Table<CacheRow, string>;

//   constructor() {
//     super("dnhs-offline");
//     // "key" is the primary key. Bump the version number if the structure ever changes.
//     this.version(1).stores({ cache: "key" });
//   }
// }

// export const offlineDb = new OfflineDb();
