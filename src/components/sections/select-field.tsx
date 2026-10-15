// src/components/sections/select-field.tsx
"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  // When given, an empty first option with this text is shown (e.g. "All").
  placeholder?: string;
  disabled?: boolean;
  // Highlights the border, same as FilterSelect does for a non-default value.
  active?: boolean;
};

// Controlled select with the same look as the Applications FilterSelect,
// but with no URL or router: the parent owns the value, so it also works offline.
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  active = false,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-md border bg-white px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
          active ? "border-primary" : "border-input",
        )}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
