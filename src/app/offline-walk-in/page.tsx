// src/app/offline-walk-in/page.tsx
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
import { Info, Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReferenceProvider } from "@/lib/enrollment/reference-context";
import { INITIAL_APPLICATION_FORM } from "@/lib/enrollment/types";
import {
  REFERENCE_KEY,
  readCache,
  readOfflineSession,
  type OfflineSession,
} from "@/lib/offline/cache";
import type { QueueRow } from "@/lib/offline/db";
import { listQueue, removeFromQueue } from "@/lib/offline/queue";
import { retryQueueItem, syncQueue } from "@/lib/offline/sync";
import { OfflineQueueList } from "@/components/offline/offline-queue-list";
import { ApplicationForm } from "@/app/admin/(portal)/applications/_components/application-form";

type ReferenceValue = ComponentProps<typeof ReferenceProvider>["value"];

type LoadState =
  | { kind: "loading" }
  | { kind: "no-access" }
  | { kind: "no-data" }
  | { kind: "ready"; session: OfflineSession; reference: ReferenceValue };

// Online / offline status straight from the browser
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

export default function OfflineWalkInPage() {
  const online = useOnline();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    setQueue(await listQueue());
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const summary = await syncQueue();
      await refreshQueue();

      const parts: string[] = [];
      if (summary.sent > 0) {
        parts.push(
          `${summary.sent} walk-in${summary.sent === 1 ? "" : "s"} sent and enrolled.`,
        );
      }
      if (summary.needsAttention > 0) {
        parts.push(
          `${summary.needsAttention} need${summary.needsAttention === 1 ? "s" : ""} attention. See the reason below.`,
        );
      }
      if (summary.stopped) {
        parts.push(
          "Could not reach the server, or your sign-in has expired. The rest are still saved here. Open the admin portal online and sign in again.",
        );
      }
      setNotice(parts.length > 0 ? parts.join(" ") : null);
    } finally {
      setSyncing(false);
    }
  }, [refreshQueue]);

  // Load the saved note and reference data from this computer
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await readOfflineSession();
      if (cancelled) return;
      if (!session || session.role === "teacher") {
        setState({ kind: "no-access" });
        return;
      }

      const cached = await readCache<ReferenceValue>(REFERENCE_KEY);
      if (cancelled) return;
      if (!cached) {
        setState({ kind: "no-data" });
        return;
      }

      setState({ kind: "ready", session, reference: cached.value });
      await refreshQueue();

      // If the page was opened with internet, send anything left from before
      if (navigator.onLine) void runSync();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshQueue, runSync]);

  // Send automatically when the browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      void runSync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [runSync]);

  async function handleRetry(id: string) {
    await retryQueueItem(id);
    await refreshQueue();
    await runSync();
  }

  async function handleDelete(id: string) {
    await removeFromQueue(id);
    await refreshQueue();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-serif text-lg font-semibold">
              Offline Walk-in Enrollment
            </p>
            <p className="text-xs opacity-80">
              Dimasalang National High School
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                online ? "bg-green-600/20" : "bg-primary/20",
              )}
            >
              {online ? (
                <Wifi className="size-3.5" />
              ) : (
                <WifiOff className="size-3.5" />
              )}
              {online ? "Online" : "Offline"}
            </span>
            {/* Plain link on purpose: a full page load, and only useful online */}
            {online && (
              <Link
                href="/admin"
                className="text-sm underline underline-offset-4 hover:opacity-80"
              >
                Back to admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </p>
        )}

        {state.kind === "no-access" && (
          <section className="rounded-md border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              Offline walk-in is not available
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This computer has no valid saved sign-in for admin or staff. Open
              the admin portal while online and sign in. After that, this page
              works without internet for 7 days.
            </p>
            {online && (
              <Link
                href="/admin"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Go to the admin portal
              </Link>
            )}
          </section>
        )}

        {state.kind === "no-data" && (
          <section className="rounded-md border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              The form is not ready on this computer yet
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Open Add New Student once while online so the form lists (school
              year, strands, barangays and so on) are saved here. Then this page
              works without internet.
            </p>
            {online && (
              <Link
                href="/admin/applications/new"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Open Add New Student
              </Link>
            )}
          </section>
        )}

        {state.kind === "ready" && (
          <>
            <div className="flex gap-3 rounded-md border border-black/10 bg-white p-4 text-sm shadow-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                You are encoding as{" "}
                <span className="font-medium text-foreground">
                  {state.session.name}
                </span>
                . Walk-ins are saved on this computer only. Your access and
                duplicate LRNs are checked when they are sent, so a student may
                be refused then.
              </p>
            </div>

            {notice && (
              <p className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-foreground shadow-sm">
                {notice}
              </p>
            )}

            <ReferenceProvider value={state.reference}>
              <ApplicationForm
                mode="new"
                initialData={INITIAL_APPLICATION_FORM}
                offlineQueue={{
                  encoder: state.session.name,
                  onQueued: () => {
                    void refreshQueue();
                    // If the internet is already back, send right away
                    if (navigator.onLine) void runSync();
                  },
                }}
              />
            </ReferenceProvider>

            <OfflineQueueList
              items={queue}
              syncing={syncing}
              online={online}
              onSync={() => void runSync()}
              onRetry={(id) => void handleRetry(id)}
              onDelete={(id) => void handleDelete(id)}
            />
          </>
        )}
      </main>
    </div>
  );
}
