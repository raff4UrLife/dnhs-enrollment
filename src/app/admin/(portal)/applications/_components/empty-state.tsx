import Link from "next/link";
import { FileX, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const Icon = hasFilters ? SearchX : FileX;

  return (
    <div className="flex flex-col items-center rounded-md border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
      <Icon className="size-10 text-muted-foreground/50" />

      <h2 className="mt-4 font-serif text-lg font-semibold text-foreground">
        {hasFilters ? "No applications found" : "No applications yet"}
      </h2>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Nothing matches your search or filters. Try different words or remove a filter."
          : "Applications for the active school year will appear here once students submit them."}
      </p>

      {hasFilters && (
        <Button
          render={<Link href="/admin/applications" />}
          variant="outline"
          size="sm"
          className="mt-5"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
