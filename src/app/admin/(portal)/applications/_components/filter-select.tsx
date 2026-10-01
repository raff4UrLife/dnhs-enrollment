"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { FilterConfig } from "../_lib/filter-options";
import { useQueryParams } from "./use-query-params";

export function FilterSelect({ config }: { config: FilterConfig }) {
  const id = useId();
  const { searchParams, setParams } = useQueryParams();

  const urlValue = searchParams.get(config.param) ?? "";

  // Keep what the user just picked on screen right away, and follow the URL
  // when it changes from somewhere else (for example "Clear filters")
  const [value, setValue] = useState(urlValue);
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);
  if (urlValue !== prevUrlValue) {
    setPrevUrlValue(urlValue);
    setValue(urlValue);
  }

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {config.label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setParams({ [config.param]: next || null });
        }}
        className={cn(
          "h-10 w-full rounded-md border bg-white px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          value ? "border-primary" : "border-input",
        )}
      >
        <option value="">All</option>
        {config.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
