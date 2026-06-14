import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";

// Server component shell. The Dashboard reads URL search params (useSearchParams),
// which must sit under a Suspense boundary or the production build errors out.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-navy">Dashboard</h1>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
