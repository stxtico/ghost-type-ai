// app/features/page.tsx
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-3xl font-semibold">Features</h1>
        <p className="mt-2 text-white/70">Placeholder for now.</p>

        <div className="mt-8">
          <Link href="/dashboard" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
