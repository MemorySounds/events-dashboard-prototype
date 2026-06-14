"use client";

// A labelled dropdown for a single filter. The empty value means "no filter"
// and renders as the `allLabel` option, so clearing a filter is just selecting
// it. Generic over the option strings for light type-safety at call sites.

interface SelectProps {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
  allLabel?: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
      {label}
      <select
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        value={value ?? ""}
        // Empty string → undefined, so the filter key is removed from the URL.
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
