"use client";

// A native <input type="date"> fires `change` both while typing and on a calendar
// pick. We commit a calendar pick immediately but defer typing to blur (so a half-typed
// date never fires a query), telling them apart by whether a key was just pressed.

import { useRef } from "react";

interface DateFieldProps {
  label: string;
  value: string | undefined;
  min?: string;
  max?: string;
  onCommit: (value: string | undefined) => void;
}

export function DateField({ label, value, min, max, onCommit }: DateFieldProps) {
  const lastKeyAt = useRef(0); // timestamp of the last keystroke

  const commit = (next: string | undefined) => {
    if (next !== value) onCommit(next);
  };

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
      {label}
      <input
        type="date"
        key={value ?? `${label}-empty`}
        defaultValue={value ?? ""}
        min={min}
        max={max}
        onKeyDown={() => {
          lastKeyAt.current = Date.now();
        }}
        onChange={(e) => {
          // Recent keystroke ⇒ typing (defer to blur); none ⇒ calendar pick (commit).
          const fromTyping = Date.now() - lastKeyAt.current < 500;
          if (!fromTyping) commit(e.target.value || undefined);
        }}
        onBlur={(e) => commit(e.target.value || undefined)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-navy focus:outline-none"
      />
    </label>
  );
}
