"use client";

import AppShell from "@/app/_components/AppShell";

export default function DownloadPage() {
  return (
    <AppShell>
      <main className="px-6 py-10 flex flex-col items-center">

        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Ghost Typer Desktop
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Download the Ghost Typer app and type anywhere with human-like behavior.
          </p>
        </div>

        <div className="w-full max-w-5xl mb-10">
  <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black backdrop-blur">
    <video
      src="/videos/Project - Made with Clipchamp.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="h-full w-full object-cover"
    />
  </div>
</div>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://github.com/stxtico/aai-web/releases/download/v1.0.0/Ghost.Typer.Setup.exe"
            className="rounded-2xl bg-white text-black px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Download for Windows
          </a>

          <a
            href="/downloads/GhostTyper-Mac.dmg"
            className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Download for Mac
          </a>
        </div>

      </main>
    </AppShell>
  );
}
