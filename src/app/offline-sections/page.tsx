// src/app/offline-sections/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import {
  readAllRosterCaches,
  readOfflineSession,
  type OfflineSession,
} from "@/lib/offline/cache";
import { useOnline } from "@/lib/offline/use-online";
import { OfflineHeader } from "@/components/offline/offline-header";
import { SectionRoster } from "@/components/sections/section-roster";
import type {
  RosterData,
  RosterPermissions,
  RosterSchoolYear,
} from "@/lib/sections/types";

// Nothing can be changed offline: no final averages, no moving learners.
const READ_ONLY: RosterPermissions = {
  canEditFinalAverage: false,
  canOverrideSection: false,
};

type CachedRoster = { data: RosterData; savedAt: number };

type LoadState =
  | { kind: "loading" }
  | { kind: "no-access" }
  | { kind: "no-data" }
  | { kind: "ready"; session: OfflineSession; rosters: CachedRoster[] };

export default function OfflineSectionsPage() {
  const online = useOnline();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load the saved sign-in note and the saved rosters from this computer
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await readOfflineSession();
      if (cancelled) return;
      // Only admin and staff get an offline copy of the rosters.
      if (!session || session.role === "teacher") {
        setState({ kind: "no-access" });
        return;
      }

      const rows = await readAllRosterCaches<RosterData>();
      if (cancelled) return;
      if (rows.length === 0) {
        setState({ kind: "no-data" });
        return;
      }

      const rosters = rows.map((row) => ({
        data: row.value,
        savedAt: row.savedAt,
      }));
      // Open on the school year that was saved most recently.
      const newest = rosters.reduce((a, b) => (b.savedAt > a.savedAt ? b : a));
      setSelectedId(newest.data.schoolYearId);
      setState({ kind: "ready", session, rosters });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rosters = useMemo(
    () => (state.kind === "ready" ? state.rosters : []),
    [state],
  );

  // The cached copies have no school year list, so build one from what is saved.
  const schoolYears = useMemo<RosterSchoolYear[]>(
    () =>
      rosters
        .map(({ data }) => ({
          id: data.schoolYearId,
          label: data.schoolYearLabel,
          isActive: false,
        }))
        .sort((a, b) => b.label.localeCompare(a.label)),
    [rosters],
  );

  const selected =
    rosters.find((r) => r.data.schoolYearId === selectedId) ?? rosters[0];

  const data = useMemo<RosterData | null>(
    () => (selected ? { ...selected.data, schoolYears } : null),
    [selected, schoolYears],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <OfflineHeader widthClass="max-w-6xl" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </p>
        )}

        {state.kind === "no-access" && (
          <section className="rounded-md border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              Offline Section Rosters is not available
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This computer has no valid saved sign-in for admin or staff. Open
              the admin portal while online and sign in. After that, this page
              works without internet for 7 days.
            </p>
            {online && (
              <a
                href="/admin"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Go to the admin portal
              </a>
            )}
          </section>
        )}

        {state.kind === "no-data" && (
          <section className="rounded-md border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              No rosters are saved on this computer yet
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Open Section Rosters once while online so a copy is saved here.
              Then this page works without internet.
            </p>
            {online && (
              <a
                href="/admin/sections"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
              >
                Open Section Rosters
              </a>
            )}
          </section>
        )}

        {state.kind === "ready" && selected && data && (
          <>
            <div>
              <h1 className="text-2xl font-semibold">
                Section Rosters (offline copy)
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Learners per section for S.Y. {data.schoolYearLabel}
              </p>
            </div>

            <div className="flex gap-3 rounded-md border border-black/10 bg-white p-4 text-sm shadow-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                This is a read-only copy saved on{" "}
                <span className="font-medium text-foreground">
                  {new Date(selected.savedAt).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                . Changes made after that will not show until you open Section
                Rosters online again. Final averages and section moves are not
                available offline.
                {online && (
                  <>
                    {" "}
                    <a
                      href="/admin/sections"
                      className="font-medium underline underline-offset-4"
                    >
                      Open the live version
                    </a>
                    .
                  </>
                )}
              </p>
            </div>

            <SectionRoster
              // A new key restarts the picker, search and page for the new year.
              key={data.schoolYearId}
              data={data}
              permissions={READ_ONLY}
              onSchoolYearChange={setSelectedId}
            />
          </>
        )}
      </main>
    </div>
  );
}
