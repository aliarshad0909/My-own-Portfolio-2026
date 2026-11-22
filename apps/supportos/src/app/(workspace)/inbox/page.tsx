import { Suspense } from "react";
import { InboxClient } from "@/components/InboxClient";

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading Shared Inbox…
        </div>
      }
    >
      <InboxClient />
    </Suspense>
  );
}
