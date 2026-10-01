"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryParams } from "./use-query-params";

type Props = {
  page: number; // current page (starts at 1)
  total: number; // total matching rows across all pages
  pageSize: number;
};

export function Pagination({ page, total, pageSize }: Props) {
  const { setParams, isPending } = useQueryParams();

  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Page 1 is the default, so it doesn't need to be in the URL
  function goTo(p: number) {
    setParams({ page: p > 1 ? String(p) : null });
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span> to{" "}
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>{" "}
        {total === 1 ? "application" : "applications"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || isPending}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <span
          aria-current="page"
          className="flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-2 text-sm font-semibold text-primary-foreground"
        >
          {page}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isPending}
          onClick={() => goTo(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
