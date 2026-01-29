"use client";

import AppShell from "@/app/_components/AppShell";
import { useTheme } from "@/app/_components/ThemeProvider";
import { useRef, useState } from "react";

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function ThemesPage() {
  const { theme, presets, setPreset, setCustomImage } = useTheme();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPickFile(file: File | null) {
    if (!file) return;
    setMsg(null);
    setBusy(true);
    try {
      await setCustomImage(file);
      setMsg("Applied your image theme.");
    } catch (e: any) {
      setMsg(e?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Themes</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Choose a wallpaper theme or upload your own image. Your UI will adapt using 3 extracted colors.
          </div>
        </div>

        {/* current palette */}
        <div className="mb-6 rounded-3xl border border-black/10 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-black/90 dark:text-white/90">Current</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                {theme.presetId === "custom" ? "Custom Image" : (presets.find((p) => p.id === theme.presetId)?.name ?? "Theme")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Swatch hex={theme.c1} />
              <Swatch hex={theme.c2} />
              <Swatch hex={theme.c3} />
            </div>
          </div>
        </div>

        {/* presets */}
        <div className="mb-3 text-sm font-semibold text-black/70 dark:text-white/70">Apple-style presets</div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => {
            const selected = theme.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPreset(p.id);
                  setMsg(`Applied “${p.name}”.`);
                }}
                className={cx(
                  "group text-left rounded-3xl border p-4 backdrop-blur transition",
                  "border-black/10 bg-white/60 hover:bg-white/80",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                  selected && "ring-2 ring-black/20 dark:ring-white/20"
                )}
              >
                <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-black/40">
                  <div
                    className="aspect-video w-full rounded-2xl"
                    style={{
                      background: p.background,
                      backgroundAttachment: "fixed",
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black/90 dark:text-white/90">{p.name}</div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">Click to apply</div>
                  </div>
                  <div className="text-xs text-black/50 dark:text-white/50">{selected ? "✓" : ""}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* upload */}
        <div className="mt-8 rounded-3xl border border-black/10 bg-white/60 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-black/90 dark:text-white/90">Upload your wallpaper</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                We’ll extract 3 colors from your image and apply them to the UI.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-xs text-black/80 hover:bg-black/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                {busy ? "Applying…" : "Choose image"}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              {msg}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <div
      className="h-6 w-6 rounded-full border border-black/15 dark:border-white/15"
      title={hex}
      style={{ background: hex }}
    />
  );
}
