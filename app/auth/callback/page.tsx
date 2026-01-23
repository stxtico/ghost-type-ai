import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
            Signing you in…
          </div>
        </main>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
