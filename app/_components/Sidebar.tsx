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
    const dashboard: Item[] = [{ href: "/", labelKey: "dashboard" }];

    const text: Item[] = [
      { href: "/detect/text", labelKey: "newText" },
      { href: "/scans/text", labelKey: "savedText" },
    ];

    const image: Item[] = [
      { href: "/detect/image", labelKey: "newImage" },
      { href: "/scans/image", labelKey: "savedImage" },
    ];

    const tools: Item[] = [{ href: "/download", labelKey: "download" }];

    // ✅ Themes page
    const themes: Item[] = [{ href: "/themes", labelKey: "themes" }];

    const billing: Item[] = [{ href: "/billing", labelKey: "billing" }];

    return { dashboard, text, image, tools, themes, billing };
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
        "border-black/10 bg-white/70 text-black",
        "dark:border-white/10 dark:bg-black/60 dark:text-white",
        w
      )}
    >
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className={cx("min-w-0", collapsed && "hidden")}>
            <div className="text-sm font-semibold tracking-tight">Ghost Typer</div>
            <div className="text-xs text-black/50 dark:text-white/50">Detect AI in text & images</div>
          </div>

          <button
            type="button"
            onClick={toggle}
            className={cx(
              "rounded-xl border px-3 py-2 text-xs transition",
              "border-black/10 bg-black/5 text-black/80 hover:bg-black/10",
              "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 px-3 pb-6">
          <Section
            title={t(lang, "dashboard") ?? "Dashboard"}
            items={sections.dashboard}
            collapsed={collapsed}
            lang={lang}
            active={isActive}
          />
          <Section title="Text" items={sections.text} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title="Image" items={sections.image} collapsed={collapsed} lang={lang} active={isActive} />
          <Section title={t(lang, "tools") ?? "Tools"} items={sections.tools} collapsed={collapsed} lang={lang} active={isActive} />

          {/* ✅ Themes section */}
          <Section title="Themes" items={sections.themes} collapsed={collapsed} lang={lang} active={isActive} />

          <Section title={t(lang, "billing") ?? "Billing"} items={sections.billing} collapsed={collapsed} lang={lang} active={isActive} />

          {/* Bottom */}
          <div className="pt-2">
            <Link
              href="/account"
              className={cx(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                "border-black/10 bg-black/5 text-black/85 hover:bg-black/10",
                "dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10",
                collapsed && "justify-center"
              )}
            >
              <span className={cx(collapsed && "hidden")}>{t(lang, "account") ?? "Account"}</span>
              <span className="text-xs opacity-60">⚙</span>
            </Link>
          </div>
        </nav>

        <div className="px-4 pb-4 text-xs text-black/35 dark:text-white/35">
          {collapsed ? "©" : "© 2026 Ghost Typer"}
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  items,
  collapsed,
  lang,
  active,
}: {
  title: string;
  items: { href: string; labelKey: string }[];
  collapsed: boolean;
  lang: any;
  active: (href: string) => boolean;
}) {
  // ✅ Force a nice fallback label if translation key is missing
  function labelFor(key: string) {
    const translated = t(lang, key);
    if (translated && translated !== key) return translated;

    if (key === "themes") return "Themes";
    if (key === "tools") return "Tools";
    if (key === "billing") return "Billing";
    if (key === "account") return "Account";
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  return (
    <div>
      <div className={cx("mb-2 px-2 text-xs text-black/45 dark:text-white/45", collapsed && "hidden")}>{title}</div>
      <div className="space-y-1">
        {items.map((it) => {
          const on = active(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                on
                  ? "bg-black/10 text-black dark:bg-white/10 dark:text-white"
                  : "text-black/70 hover:bg-black/5 hover:text-black/90 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white/90",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? labelFor(it.labelKey) : undefined}
            >
              <span className={cx("truncate", collapsed && "hidden")}>{labelFor(it.labelKey)}</span>
              <span className="text-xs opacity-60">{on ? "•" : ""}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
