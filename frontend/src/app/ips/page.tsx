import { Suspense } from "react";
import { TopIpsView } from "@/components/TopIpsView";

// Server shell. TopIpsView uses useSearchParams (via the global filters), so it
// must sit under a Suspense boundary for the production build.
export default function IpsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Top IPs</h1>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <TopIpsView />
      </Suspense>
    </main>
  );
}
