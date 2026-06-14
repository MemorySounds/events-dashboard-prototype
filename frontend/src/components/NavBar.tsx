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
    <header className="bg-navy">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <span className="mr-5 text-sm tracking-tight">
          <span className="font-semibold text-white">CryptoNext</span>
          <span className="text-accent">.</span>
          <span className="font-normal text-gray-400">Events</span>
        </span>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={query ? `${href}?${query}` : href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-gray-300 hover:bg-navy-light hover:text-white"
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
