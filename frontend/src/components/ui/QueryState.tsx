// Standardises the loading / error / empty states across every data section,
// so each chart and table handles them the same way (a brief requirement).
//
// Pass the flags from a TanStack Query result plus an `isEmpty` test; children
// render only on success with data. The parent owns the surrounding box (and
// thus its height), so this just centres a status message inside it.

import type { ReactNode } from "react";

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = "No data for the selected filters.",
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <Centered>
        <span className="animate-pulse">Loading…</span>
      </Centered>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return (
      <Centered>
        <span className="text-red-600">{message}</span>
      </Centered>
    );
  }

  if (isEmpty) {
    return <Centered>{emptyMessage}</Centered>;
  }

  return <>{children}</>;
}
