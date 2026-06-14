"use client";

// Top navigation across the three views, with the active link highlighted
// (needs usePathname, hence a client component).
//
// Links carry the current query string forward so the global filters persist
// when switching tabs — the filters are "global", so a critical-severity view
// stays critical across pages. (Only global filters live in the URL; per-page
// state like table search/sort/page is local, so nothing else leaks across.)

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/ips", label: "Top IPs" },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <span className="mr-4 text-sm font-semibold text-gray-900">
          Crypto Events
        </span>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={query ? `${href}?${query}` : href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
