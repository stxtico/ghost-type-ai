import { Suspense } from "react";
import BillingInner from "./BillingInner";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
            Loading billing…
          </div>
        </div>
      }
    >
      <BillingInner />
    </Suspense>
  );
}
