// src/lib/offline/sync.ts
import { runWalkInFlow } from "@/lib/enrollment/walk-in-flow";
import {
  listQueue,
  removeFromQueue,
  updateQueueItem,
} from "@/lib/offline/queue";

export type SyncSummary = {
  sent: number; // confirmed by the server and removed from the queue
  needsAttention: number; // refused by the server, kept with the reason
  stopped: boolean; // true if there was no connection or the server could not be reached
};

const LOCK_NAME = "dnhs-offline-sync";

// Stops two sends from running at the same time in THIS tab
// (online event + "Sync now" button)
let running = false;

// The real sending work. Only ever runs while holding the lock below.
async function sendAll(summary: SyncSummary): Promise<void> {
  // Items marked "needs-attention" are not retried until staff press Try again
  const items = (await listQueue()).filter((i) => i.status === "waiting");

  for (const item of items) {
    try {
      const result = await runWalkInFlow({
        data: item.data,
        files: item.files,
        documentNames: item.documentNames,
        progress: item.progress,
        // The id made when the walk-in was saved on this computer. It becomes
        // the application's id, so a send that was cut off can be repeated
        // safely instead of being refused as a duplicate LRN.
        clientId: item.id,
      });

      if (result.ok) {
        // Removed only after the server confirmed everything, including approval
        await removeFromQueue(item.id);
        summary.sent++;
      } else {
        // The server answered but refused (e.g. duplicate LRN) or a step failed.
        // Keep the item and the progress so a retry continues where it stopped.
        await updateQueueItem(item.id, {
          status: "needs-attention",
          error: result.error,
          progress: result.progress,
        });
        summary.needsAttention++;
      }
    } catch (error) {
      // No connection, signed out, or the server was unreachable.
      // Leave this item and the rest waiting, and stop for now.
      console.error("[offline] sync stopped:", error);
      summary.stopped = true;
      break;
    }
  }
}

export async function syncQueue(): Promise<SyncSummary> {
  const summary: SyncSummary = { sent: 0, needsAttention: 0, stopped: false };

  if (running) return summary;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    summary.stopped = true;
    return summary;
  }

  running = true;
  try {
    if (typeof navigator !== "undefined" && "locks" in navigator) {
      // One send at a time across ALL open tabs. If another tab is already
      // sending, this tab does nothing; the other tab will send everything.
      await navigator.locks.request(
        LOCK_NAME,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) return;
          await sendAll(summary);
        },
      );
    } else {
      await sendAll(summary);
    }
  } finally {
    running = false;
  }

  return summary;
}

// Puts a "needs-attention" item back in line (after staff fix it or want to retry)
export async function retryQueueItem(id: string): Promise<void> {
  await updateQueueItem(id, { status: "waiting", error: null });
}

// // src/lib/offline/sync.ts
// import { runWalkInFlow } from "@/lib/enrollment/walk-in-flow";
// import {
//   listQueue,
//   removeFromQueue,
//   updateQueueItem,
// } from "@/lib/offline/queue";

// export type SyncSummary = {
//   sent: number; // confirmed by the server and removed from the queue
//   needsAttention: number; // refused by the server, kept with the reason
//   stopped: boolean; // true if there was no connection or the server could not be reached
// };

// // Stops two sends from running at the same time (online event + "Sync now" button)
// let running = false;

// export async function syncQueue(): Promise<SyncSummary> {
//   const summary: SyncSummary = { sent: 0, needsAttention: 0, stopped: false };

//   if (running) return summary;
//   if (typeof navigator !== "undefined" && !navigator.onLine) {
//     summary.stopped = true;
//     return summary;
//   }

//   running = true;
//   try {
//     // Items marked "needs-attention" are not retried until staff press Try again
//     const items = (await listQueue()).filter((i) => i.status === "waiting");

//     for (const item of items) {
//       try {
//         const result = await runWalkInFlow({
//           data: item.data,
//           files: item.files,
//           documentNames: item.documentNames,
//           progress: item.progress,
//         });

//         if (result.ok) {
//           // Removed only after the server confirmed everything, including approval
//           await removeFromQueue(item.id);
//           summary.sent++;
//         } else {
//           // The server answered but refused (e.g. duplicate LRN) or a step failed.
//           // Keep the item and the progress so a retry continues where it stopped.
//           await updateQueueItem(item.id, {
//             status: "needs-attention",
//             error: result.error,
//             progress: result.progress,
//           });
//           summary.needsAttention++;
//         }
//       } catch (error) {
//         // No connection, signed out, or the server was unreachable.
//         // Leave this item and the rest waiting, and stop for now.
//         console.error("[offline] sync stopped:", error);
//         summary.stopped = true;
//         break;
//       }
//     }
//   } finally {
//     running = false;
//   }

//   return summary;
// }

// // Puts a "needs-attention" item back in line (after staff fix it or want to retry)
// export async function retryQueueItem(id: string): Promise<void> {
//   await updateQueueItem(id, { status: "waiting", error: null });
// }
