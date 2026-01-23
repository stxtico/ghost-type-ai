"use client";

import { Suspense } from "react";
import AccountInner from "./AccountInner";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white/70">Loading…</div>}>
      <AccountInner />
    </Suspense>
  );
}
