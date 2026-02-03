"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLang, t } from "./LanguageProvider";

type Item = { href: string; labelKey: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();
  const { lang } = useLang();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("gt_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("gt_sidebar_collapsed", next ? "1" : "0");
  }

  const sections = useMemo(() => {
    return {
      dashboard: [{ href: "/", labelKey: "dashboard" }],
      text: [
        { href: "/detect/text", labelKey: "newText" },
        { href: "/scans/text", labelKey: "savedText" },
      ],
      image: [
        { href: "/detect/image", labelKey: "newImage" },
        { href: "/scans/image", labelKey: "savedImage" },
      ],
      tools: [{ href: "/download", labelKey: "download" }],
      themes: [{ href: "/themes", labelKey: "themes" }],
      billing: [{ href: "/billing", labelKey: "billing" }],
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const w = collapsed ? "w-[76px]" : "w-[260px]";

  return (
    <aside
      className={cx(
        "h-screen shrink-0 border-r backdrop-blur",
        "border-white/10 bg-black/60 text-white",
        w
      )}
    >
      <div className="flex h-full flex-col">
        {/* BRAND */}
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className={cx("flex items-center gap-3", collapsed && "hidden")}>
            <img
              src="/branding/ghost-light.png"
              alt="Ghost Typer"
              className="h-7 w-7 object-contain"
            />
            <div>
              <div className="text-sm font-semibold">Ghost Typer</div>
              <div className="text-xs text-white/50">
                Detect AI in text & images
              </div>
            </div>
          </div>

          <button
            onClick={toggle}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-5 px-3 pb-6">
          <Section title={t(lang, "dashboard")} items={sections.dashboard} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title="Text" items={sections.text} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title="Image" items={sections.image} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title={t(lang, "tools")} items={sections.tools} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title="Themes" items={sections.themes} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title={t(lang, "billing")} items={sections.billing} collapsed={collapsed} lang={lang} active={isActive} />
        </nav>

        <div className="px-4 pb-4 text-xs text-white/35">
          {collapsed ? "©" : "© 2026 Ghost Typer"}
        </div>
      </div>
    </aside>
  );
}

function Section({ title, items, collapsed, lang, active }: any) {
  return (
    <div>
      <div className={cx("mb-2 px-2 text-xs text-white/45", collapsed && "hidden")}>
        {title}
      </div>
      <div className="space-y-1">
        {items.map((it: any) => {
          const on = active(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                on
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <span className={cx("truncate", collapsed && "hidden")}>
                {t(lang, it.labelKey)}
              </span>
              <span className="text-xs opacity-60">{on ? "•" : ""}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
