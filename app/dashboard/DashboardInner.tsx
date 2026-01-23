"use client";

import AppShell from "@/app/_components/AppShell";

export default function DashboardInner() {
  return (
    <AppShell>
      <main className="px-10 py-10">
        <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
        <div className="mt-2 text-sm text-white/60">
          Your scans will show here soon (recent scans, usage, quick actions).
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Quick actions</div>
            <div className="mt-2 text-sm text-white/60">
              Use the buttons in the sidebar to start a new scan.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Recent scans</div>
            <div className="mt-2 text-sm text-white/40">
              Coming next: show saved scans here.
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
