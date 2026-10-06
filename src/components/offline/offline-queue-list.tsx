// src/components/offline/offline-queue-list.tsx
"use client";

import { Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { QueueRow } from "@/lib/offline/db";

type Props = {
  items: QueueRow[];
  syncing: boolean;
  online: boolean;
  onSync: () => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
};

function learnerName(item: QueueRow) {
  const { last_name, first_name, middle_name, extension_name } = item.data;
  const rest = [first_name, middle_name, extension_name]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  return `${last_name.trim()}${rest ? `, ${rest}` : ""}`;
}

function savedAt(ms: number) {
  return new Date(ms).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OfflineQueueList({
  items,
  syncing,
  online,
  onSync,
  onRetry,
  onDelete,
}: Props) {
  const waiting = items.filter((i) => i.status === "waiting").length;

  return (
    <section className="space-y-3 rounded-md border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Saved on this computer
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Nothing is waiting to be sent."
              : `${items.length} saved, ${waiting} waiting to be sent.`}
          </p>
        </div>
        <Button
          type="button"
          onClick={onSync}
          disabled={syncing || !online || waiting === 0}
        >
          {syncing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {syncing ? "Sending..." : "Sync now"}
        </Button>
      </div>

      {!online && items.length > 0 && (
        <p className="text-sm text-muted-foreground">
          No internet right now. These will be sent automatically when it
          returns.
        </p>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-black/10">
          {items.map((item) => {
            const needsAttention = item.status === "needs-attention";
            return (
              <li key={item.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {learnerName(item)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      LRN {item.data.lrn || "-"}
                      {item.data.grade_level
                        ? ` · Grade ${item.data.grade_level}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Encoded by {item.encoder} · {savedAt(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        needsAttention
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/15 text-foreground",
                      )}
                    >
                      {needsAttention ? "Needs attention" : "Waiting"}
                    </span>
                    {needsAttention && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={syncing || !online}
                        onClick={() => onRetry(item.id)}
                      >
                        <RotateCcw className="size-4" />
                        Try again
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={syncing}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete ${learnerName(item)} from this computer? This cannot be undone.`,
                          )
                        ) {
                          onDelete(item.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                {needsAttention && item.error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {item.error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
