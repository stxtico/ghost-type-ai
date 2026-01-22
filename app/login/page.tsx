import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
            Loading…
          </div>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
