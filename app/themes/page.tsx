"use client";

import AppShell from "@/app/_components/AppShell";
import WallpaperPicker from "@/app/_components/WallpaperPicker";

export default function ThemesPage() {
  return (
    <AppShell>
      <main className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Themes</div>
          <div className="mt-1 text-sm text-white/60">
            Choose a preset wallpaper or upload your own image. We’ll extract 3 dominant colors and apply them to the UI.
          </div>
        </div>

        <WallpaperPicker />

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold text-white/90">How it works</div>
          <ul className="mt-2 space-y-1 text-sm text-white/65">
            <li>• Presets: instant dark wallpapers.</li>
            <li>• Upload: your image becomes the background.</li>
            <li>• We compute 3 dominant accents and store them on your device.</li>
          </ul>
        </div>
      </main>
    </AppShell>
  );
}
