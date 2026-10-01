"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useQueryParams } from "./use-query-params";

const DELAY_MS = 400;

export function SearchInput() {
  const { searchParams, setParams, isPending } = useQueryParams();

  const urlValue = searchParams.get("q") ?? "";

  const [text, setText] = useState(urlValue); // what is typed in the box
  const [sent, setSent] = useState(urlValue); // what we last put in the URL
  const [prevUrlValue, setPrevUrlValue] = useState(urlValue);

  // If the URL changed from somewhere else (for example "Clear filters"),
  // follow it. Changes we made ourselves are ignored.
  if (urlValue !== prevUrlValue) {
    setPrevUrlValue(urlValue);
    if (urlValue !== sent) {
      setText(urlValue);
      setSent(urlValue);
    }
  }

  // As-you-type search: wait for a pause in typing, then update the URL
  useEffect(() => {
    const clean = text.trim();
    if (clean === sent) return;

    const timer = setTimeout(() => {
      setSent(clean);
      setParams({ q: clean || null });
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [text, sent, setParams]);

  function searchNow(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = text.trim();
    setSent(clean);
    setParams({ q: clean || null });
  }

  function clear() {
    setText("");
    setSent("");
    setParams({ q: null });
  }

  return (
    <form onSubmit={searchNow} role="search" className="relative">
      {isPending ? (
        <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search LRN, last name, first name or middle name"
        aria-label="Search applications"
        maxLength={50}
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-md border border-input bg-white pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />

      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
