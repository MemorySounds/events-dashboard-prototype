"use client";

// App-wide client providers. Currently just TanStack Query. Rendered once in
// the root layout, wrapping {children} as deep as possible (the layout itself
// stays a Server Component).

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session, created lazily in state so it is not
  // shared across requests/renders (the standard Next.js + TanStack pattern).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Small, mostly-static dataset: avoid noisy refetches, keep cache warm.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
