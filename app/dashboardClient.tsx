"use client";

import Link from "next/link";
import { useLang, t } from "./_components/LanguageProvider";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-black/10 bg-white/70 p-5 backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
    >
      <div className="rounded-2xl border border-black/10 bg-black/5 p-6 dark:border-white/10 dark:bg-black/40">
        <div className="h-37.5 w-full rounded-2xl bg-linear-to-br from-black/10 to-black/0 dark:from-white/10 dark:to-white/0" />
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-black dark:text-white">{title}</div>
        <div className="mt-1 text-xs text-black/60 dark:text-white/60">{desc}</div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-black/50 dark:text-white/50">Open</span>
        <span className="rounded-xl border border-black/10 bg-black/5 px-3 py-1 text-xs text-black/70 group-hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:group-hover:bg-white/10">
          →
        </span>
      </div>
    </Link>
  );
}

export default function DashboardClient() {
  const { lang } = useLang();

  return (
    <main className="px-10 py-8">
      <div className="mb-6">
        <div className="text-xl font-semibold">{t(lang, "featured")}</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">{t(lang, "startHere")}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card
          title={t(lang, "textScan")}
          desc="Detect AI probability in text with sentence highlights and scores."
          href="/detect/text"
        />
        <Card
          title={t(lang, "imageScan")}
          desc="Upload an image and detect AI likelihood. Track credits."
          href="/detect/image"
        />
        <Card
          title={t(lang, "ghostTyper")}
          desc="Type anywhere with customizable speed, delays, and realistic mistakes."
          href="/download"
        />
      </div>

      <div className="mt-10 rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Your saved scans are in the sidebar under “Saved Text Scans” and “Saved Image Scans”.
      </div>
    </main>
  );
}
