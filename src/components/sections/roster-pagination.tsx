// src/components/sections/roster-pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// How many rows the roster table shows per page (same as Applications).
export const ROSTER_PAGE_SIZE = 20;

type RosterPaginationProps = {
  page: number; // current page (starts at 1)
  total: number; // total matching rows across all pages
  pageSize?: number;
  onPageChange: (page: number) => void;
};

// Slices the rows for one page. Used by the table, so the math lives in one place.
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function RosterPagination({
  page,
  total,
  pageSize = ROSTER_PAGE_SIZE,
  onPageChange,
}: RosterPaginationProps) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span> to{" "}
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>{" "}
        {total === 1 ? "learner" : "learners"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          className="bg-sky-500"
          type="button"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <span
          aria-current="page"
          className="flex h-8 min-w-8 items-center justify-center rounded-md bg-sky-500 px-2 text-sm font-semibold text-primary-foreground"
        >
          {page}
        </span>

        <Button
          className="bg-sky-500"
          type="button"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
