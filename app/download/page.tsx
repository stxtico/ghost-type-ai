import Link from "next/link";

export default function DownloadPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4 border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Download AAI</h1>
        <p className="text-neutral-600">
          This will link to your latest Windows installer.
        </p>

        <a className="inline-block px-4 py-2 rounded-lg bg-black text-white" href="https://google.com" target="_blank" rel="noreferrer">
          Download (placeholder)
        </a>

        <Link className="underline" href="/account">Back to account</Link>
      </div>
    </main>
  );
}
