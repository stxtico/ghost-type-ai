import { Suspense } from "react";
import DashboardInner from "./DashboardInner";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/70">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
