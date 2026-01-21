import AppShell from "@/app/_components/AppShell";

export default function DownloadPage() {
  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-8">
          <div className="text-2xl font-semibold tracking-tight">Download Desktop</div>
          <div className="mt-1 text-sm text-white/60">
            Get the AAI desktop typer (system-level typing).
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Windows</div>
            <div className="mt-2 text-sm text-white/60">
              You’ll host the installer here (or a direct download link).
            </div>

            <a
              href="#"
              className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Download (coming soon)
            </a>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Requirements</div>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/60">
              <li>Windows 10/11</li>
              <li>.NET 8 Desktop Runtime (we can bundle later)</li>
              <li>Admin privileges may be required for some automation features</li>
            </ul>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
