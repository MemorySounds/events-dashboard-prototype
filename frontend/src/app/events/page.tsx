import { Suspense } from "react";
import { EventsView } from "@/components/EventsView";

// Server shell. EventsView uses useSearchParams (via the global filters), so it
// must sit under a Suspense boundary for the production build.
export default function EventsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Events</h1>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <EventsView />
      </Suspense>
    </main>
  );
}
