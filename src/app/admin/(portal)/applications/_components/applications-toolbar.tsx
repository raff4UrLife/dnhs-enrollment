// src/app/admin/(portal)/applications/_components/applications-toolbar.tsx
"use client";

import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterConfig } from "../_lib/filter-options";
import { FilterSelect } from "./filter-select";
import { SearchInput } from "./search-input";
import { useQueryParams } from "./use-query-params";

export function ApplicationsToolbar({ filters }: { filters: FilterConfig[] }) {
  const { searchParams, setParams } = useQueryParams();

  // School year and Status sit beside the search box, the rest go below
  const [schoolYear, status, ...others] = filters;

  // The School year param only appears in the URL when it is not the active
  // year, so this is true only when something differs from the default view
  const hasActive =
    searchParams.has("q") || filters.some((f) => searchParams.has(f.param));

  function clearAll() {
    const updates: Record<string, string | null> = { q: null };
    for (const f of filters) updates[f.param] = null;
    setParams(updates);
  }

  return (
    <div className="rounded-md border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <SearchInput />
        </div>

        {schoolYear && (
          <div className="sm:w-36">
            <FilterSelect config={schoolYear} />
          </div>
        )}

        {status && (
          <div className="sm:w-44">
            <FilterSelect config={status} />
          </div>
        )}

        {hasActive && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-10 shrink-0"
          >
            <FilterX className="size-4" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {others.map((f) => (
          <FilterSelect key={f.param} config={f} />
        ))}
      </div>
    </div>
  );
}
