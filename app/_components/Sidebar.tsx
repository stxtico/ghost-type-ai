"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function NavButton({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
        active
          ? "border-white/25 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      <span className="text-white/60">→</span>
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 text-xs font-semibold tracking-wide text-white/50">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const scansType = search.get("type"); // "text" | "image" | null

  const isActive = (href: string) => {
    // active checks for /scans?type=...
    if (href.startsWith("/scans")) {
      if (!pathname.startsWith("/scans")) return false;
      const u = new URL(href, "http://x");
      const t = u.searchParams.get("type");
      if (!t) return pathname === "/scans";
      return pathname.startsWith("/scans") && scansType === t;
    }

    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="w-[280px] shrink-0 border-r border-white/10 bg-black px-5 py-5">
      {/* Brand */}
      <div className="mb-6">
        <div className="text-lg font-semibold tracking-tight text-white">Ghost</div>
        <div className="mt-1 text-xs text-white/50">Detect AI in text & images</div>
      </div>

      {/* Dashboard */}
      <NavButton href="/" label="Dashboard" active={isActive("/")} />

      {/* Detect */}
      <SectionTitle>Text</SectionTitle>
      <NavButton href="/detect/text" label="New Text Scan" active={isActive("/detect/text")} />
      <NavButton href="/scans?type=text" label="Saved Text Scans" active={isActive("/scans?type=text")} />

      <SectionTitle>Image</SectionTitle>
      <NavButton href="/detect/image" label="New Image Scan" active={isActive("/detect/image")} />
      <NavButton href="/scans?type=image" label="Saved Image Scans" active={isActive("/scans?type=image")} />

      {/* Tools */}
      <SectionTitle>Tools</SectionTitle>
      <NavButton href="/download" label="Download Typer" active={isActive("/download")} />

      {/* Billing */}
      <SectionTitle>Billing</SectionTitle>
      <NavButton href="/billing" label="Manage Subscription" active={isActive("/billing")} />

      {/* Footer */}
      <div className="mt-8 text-xs text-white/35">© {new Date().getFullYear()} Ghost</div>
    </aside>
  );
}
