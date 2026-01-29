"use client";

import React, { useRef, useState } from "react";
import { useWallpaper } from "./WallpaperProvider";

const PRESETS = [
  { id: "amethyst", label: "Amethyst" },
  { id: "ultraviolet", label: "Ultraviolet" },
  { id: "deep_ocean", label: "Deep Ocean" },
  { id: "nebula", label: "Nebula" },
  { id: "midnight", label: "Midnight" },
  { id: "crimson", label: "Crimson" },
  { id: "ember", label: "Ember" },
] as const;

export default function WallpaperPicker() {
  const { state, setPreset, setUpload, clearUpload } = useWallpaper();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPickFile(file: File | null) {
    if (!file) return;

    setErr(null);
    setBusy(true);

    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });

      await setUpload(dataUrl);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white/90">Background</div>
          <div className="mt-1 text-xs text-white/55">
            Pick a preset wallpaper or upload your own. We auto-match accent colors.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10 disabled:opacity-60"
          >
            {busy ? "Applying…" : "Upload"}
          </button>

          <button
            type="button"
            onClick={clearUpload}
            disabled={busy}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-60"
          >
            Presets
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {err && <div className="mt-3 text-xs text-red-200">{err}</div>}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {PRESETS.map((p) => {
          const active = state.mode === "preset" && state.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id as any)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                active
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
        <span>Accents:</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
          rgb(var(--gt-accent))
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
          rgb(var(--gt-accent-2))
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
          rgb(var(--gt-accent-3))
        </span>
      </div>
    </div>
  );
}
