// A titled content panel. Used to frame each chart/table section consistently.

import type { ReactNode } from "react";

interface CardProps {
  title: string;
  // Optional control rendered on the right of the header (e.g. a toggle).
  action?: ReactNode;
  children: ReactNode;
}

export function Card({ title, action, children }: CardProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
