// app/page.tsx
"use client";

import AppShell from "@/app/_components/AppShell";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

function Card({
  href,
  title,
  subtitle,
  children,
}: {
  href: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-black/10 bg-white/60 p-4 sm:p-5 shadow-sm backdrop-blur hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <div className="rounded-2xl border border-black/10 bg-black/5 p-3 sm:p-4 dark:border-white/10 dark:bg-black/40">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-black/60">
          {children}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold tracking-tight text-black/90 dark:text-white/90">
          {title}
        </div>
        <div className="mt-1 text-xs text-black/60 dark:text-white/60">{subtitle}</div>
      </div>
    </Link>
  );
}

function VercelTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1155 1000" className={className} aria-hidden="true">
      <path d="M577.5 0L1155 1000H0L577.5 0Z" fill="currentColor" />
    </svg>
  );
}

type GlitchVariant = 1 | 2 | 3 | 4;

function IntroHero() {
  // 0 = glitch overlay, 1 = show logo, 2 = type intro
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  // ✅ SSR-safe: start deterministic, then randomize AFTER mount
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<GlitchVariant>(1);

  // ✅ pre-generated rows so we don't call Math.random during render
  const [matrixRows, setMatrixRows] = useState<string[]>([]);
  const [codeRows, setCodeRows] = useState<string[]>([]);

  const [typed, setTyped] = useState("");

  const intro = useMemo(
    () =>
      "Welcome to Ghost Typer — detect AI in text and images, then type anywhere with human-like controls. Customize speed, pauses, and mistakes to match your style, and keep everything organized in one clean dashboard.",
    []
  );

  useEffect(() => {
    setMounted(true);

    // pick random glitch style client-side only
    const r = (Math.floor(Math.random() * 4) + 1) as GlitchVariant;
    setVariant(r);

    // generate “hacking” rows client-side only
    setMatrixRows(Array.from({ length: 36 }).map(() => randomHackRow(150)));
    setCodeRows(Array.from({ length: 26 }).map(() => randomHackRow(165)));
  }, []);

  useEffect(() => {
    // glitch overlay ~0.5s
    const t1 = window.setTimeout(() => setStage(1), 520);
    const t2 = window.setTimeout(() => setStage(2), 760);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (stage !== 2) return;

    setTyped("");
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(intro.slice(0, i));
      if (i >= intro.length) window.clearInterval(tick);
    }, 16);
    return () => window.clearInterval(tick);
  }, [stage, intro]);

  // "for some" variants show centered logo
  const showCenteredOverlayLogo = variant === 2 || variant === 4;

  // ✅ During SSR (mounted=false), we render NOTHING random.
  // We still show the normal intro bar, and the overlay is hidden until mounted.
  return (
    <div className="relative mb-6">
      {/* Fullscreen glitch overlay (only rendered after mount to avoid hydration mismatch) */}
      {mounted && (
        <div
          className={[
            "pointer-events-none fixed inset-0 z-60 transition-opacity duration-150",
            stage === 0 ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black" />

          {/* VARIANT 1 */}
          {variant === 1 && (
            <>
              <div className="gt-bars absolute inset-0 opacity-95" />
              <div className="gt-cols absolute inset-0 opacity-70" />
              <div className="gt-scanlines absolute inset-0 opacity-30" />
              <div className="gt-blocksBig absolute inset-0 opacity-90" />
              <div className="gt-matrix absolute inset-0 opacity-55">
                <div className="gt-matrixInner">
                  {matrixRows.map((row, idx) => (
                    <div key={idx} className="gt-matrixRow">
                      {row}
                    </div>
                  ))}
                </div>
              </div>
              <div className="gt-flash absolute inset-0" />
            </>
          )}

          {/* VARIANT 2 */}
          {variant === 2 && (
            <>
              <div className="gt-tearStorm absolute inset-0 opacity-95" />
              <div className="gt-pixelBlocks absolute inset-0 opacity-95" />
              <div className="gt-noise absolute inset-0 opacity-55" />
              <div className="gt-flash2 absolute inset-0" />
            </>
          )}

          {/* VARIANT 3 */}
          {variant === 3 && (
            <>
              <div className="gt-crtRoll absolute inset-0 opacity-70" />
              <div className="gt-banding absolute inset-0 opacity-90" />
              <div className="gt-chunks absolute inset-0 opacity-95" />
              <div className="gt-codeRain absolute inset-0 opacity-60">
                <div className="gt-codeInner">
                  {codeRows.map((row, idx) => (
                    <div key={idx} className="gt-codeRow">
                      {row}
                    </div>
                  ))}
                </div>
              </div>
              <div className="gt-vignette absolute inset-0 opacity-90" />
            </>
          )}

          {/* VARIANT 4 */}
          {variant === 4 && (
            <>
              <div className="gt-pulse absolute inset-0 opacity-85" />
              <div className="gt-slices absolute inset-0 opacity-90" />
              <div className="gt-shards absolute inset-0 opacity-85" />
              <div className="gt-mosaicBlocks absolute inset-0 opacity-95" />
              <div className="gt-noise absolute inset-0 opacity-45" />
            </>
          )}

          {/* Center logo “for some” */}
          {showCenteredOverlayLogo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative text-white/85">
                <VercelTriangle className="h-24 w-24" />
                <VercelTriangle className="gt-centerLogo1 absolute inset-0 h-24 w-24 text-white/55" />
                <VercelTriangle className="gt-centerLogo2 absolute inset-0 h-24 w-24 text-white/35" />
                <VercelTriangle className="gt-centerLogo3 absolute inset-0 h-24 w-24 text-white/25" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intro bar (always SSR-safe) */}
      <div className="rounded-3xl border border-black/10 bg-white/60 p-4 sm:p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start gap-4">
          <div className="relative mt-0.5 h-10 w-10 shrink-0 text-black/90 dark:text-white/90">
            <VercelTriangle className="h-10 w-10" />
            {stage <= 1 && (
              <>
                <VercelTriangle className="gt-logo1 absolute inset-0 h-10 w-10 text-white/70 dark:text-white/60" />
                <VercelTriangle className="gt-logo2 absolute inset-0 h-10 w-10 text-white/40 dark:text-white/35" />
                <VercelTriangle className="gt-logo3 absolute inset-0 h-10 w-10 text-white/25 dark:text-white/20" />
              </>
            )}
          </div>

          <div className="min-w-0">
            <p className="mt-0.5 text-sm leading-relaxed text-black/70 dark:text-white/70">
              {stage < 2 ? (
                <span className="inline-block opacity-60">Initializing…</span>
              ) : (
                <>
                  {typed}
                  <span className="gt-caretInline">▍</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .gt-caretInline {
          display: inline-block;
          margin-left: 2px;
          animation: gtCaretBlink 1s step-end infinite;
          opacity: 0.85;
        }
        @keyframes gtCaretBlink {
          50% {
            opacity: 0;
          }
        }

        /* ===== small logo glitch (gray) ===== */
        .gt-logo1 {
          animation: gtLogo1 0.45s steps(6, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.55;
        }
        .gt-logo2 {
          animation: gtLogo2 0.45s steps(6, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.4;
        }
        .gt-logo3 {
          animation: gtLogo3 0.45s steps(6, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.28;
        }
        @keyframes gtLogo1 {
          0% {
            transform: translate(0, 0);
            clip-path: inset(0 0 0 0);
          }
          20% {
            transform: translate(-2px, 1px);
            clip-path: inset(10% 0 55% 0);
          }
          45% {
            transform: translate(2px, -1px);
            clip-path: inset(0 0 35% 0);
          }
          75% {
            transform: translate(-1px, 0px);
            clip-path: inset(45% 0 0 0);
          }
          100% {
            transform: translate(0, 0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtLogo2 {
          0% {
            transform: translate(0, 0);
            clip-path: inset(0 0 0 0);
          }
          30% {
            transform: translate(3px, 0px);
            clip-path: inset(18% 0 40% 0);
          }
          60% {
            transform: translate(-2px, 1px);
            clip-path: inset(0 0 60% 0);
          }
          100% {
            transform: translate(0, 0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtLogo3 {
          0% {
            transform: translate(0, 0);
          }
          35% {
            transform: translate(-3px, -1px);
          }
          70% {
            transform: translate(2px, 1px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* ===== centered overlay logo glitch ===== */
        .gt-centerLogo1 {
          animation: gtCenter1 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.55;
        }
        .gt-centerLogo2 {
          animation: gtCenter2 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.35;
        }
        .gt-centerLogo3 {
          animation: gtCenter3 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          opacity: 0.25;
        }
        @keyframes gtCenter1 {
          0% {
            transform: translate(0, 0) scale(1);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translate(-6px, 2px) scale(1.01);
            clip-path: inset(18% 0 35% 0);
          }
          55% {
            transform: translate(6px, -2px) scale(0.99);
            clip-path: inset(0 0 55% 0);
          }
          100% {
            transform: translate(0, 0) scale(1);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtCenter2 {
          0% {
            transform: translate(0, 0);
          }
          35% {
            transform: translate(8px, 0px);
          }
          70% {
            transform: translate(-6px, 2px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
        @keyframes gtCenter3 {
          0% {
            transform: translate(0, 0);
          }
          40% {
            transform: translate(-10px, -2px);
          }
          80% {
            transform: translate(8px, 2px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* ===== VARIANT 1 ===== */
        .gt-bars {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 6px,
            rgba(255, 255, 255, 0.07) 7px,
            rgba(255, 255, 255, 0) 10px
          );
          animation: gtBars 0.5s linear infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.2) brightness(1.1);
        }
        .gt-cols {
          background: repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 18px,
            rgba(255, 255, 255, 0.08) 19px,
            rgba(255, 255, 255, 0) 24px
          );
          animation: gtCols 0.5s steps(8, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.35);
        }
        .gt-scanlines {
          background: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 1px,
            rgba(0, 0, 0, 0) 3px,
            rgba(0, 0, 0, 0) 6px
          );
          animation: gtScan 0.5s linear infinite;
          mix-blend-mode: overlay;
        }
        .gt-blocksBig {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
          animation: gtBigBlocks 0.5s steps(6, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.3);
        }
        .gt-matrixInner {
          position: absolute;
          inset: -20px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
          line-height: 1.2;
          color: rgba(220, 220, 220, 0.75);
          transform: skewX(-6deg);
          animation: gtMatrixMove 0.5s linear infinite;
        }
        .gt-matrixRow {
          white-space: nowrap;
          opacity: 0.8;
          animation: gtMatrixFlicker 0.5s steps(6, end) infinite;
        }
        .gt-flash {
          background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 60%);
          animation: gtFlash 0.5s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes gtBars {
          0% {
            transform: translateY(0) scaleY(1);
          }
          20% {
            transform: translateY(-10px) scaleY(1.05);
          }
          45% {
            transform: translateY(16px) scaleY(0.95);
          }
          70% {
            transform: translateY(-6px) scaleY(1.08);
          }
          100% {
            transform: translateY(0) scaleY(1);
          }
        }
        @keyframes gtCols {
          0% {
            transform: translateX(0);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translateX(-18px);
            clip-path: inset(12% 0 40% 0);
          }
          55% {
            transform: translateX(10px);
            clip-path: inset(0 0 55% 0);
          }
          80% {
            transform: translateX(-6px);
            clip-path: inset(38% 0 0 0);
          }
          100% {
            transform: translateX(0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtScan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(24px);
          }
        }
        @keyframes gtMatrixMove {
          0% {
            transform: translateX(-18px) translateY(0) skewX(-6deg);
          }
          100% {
            transform: translateX(18px) translateY(-12px) skewX(-6deg);
          }
        }
        @keyframes gtMatrixFlicker {
          0% {
            opacity: 0.35;
          }
          25% {
            opacity: 0.85;
          }
          60% {
            opacity: 0.4;
          }
          100% {
            opacity: 0.75;
          }
        }
        @keyframes gtFlash {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 0.55;
          }
          55% {
            opacity: 0.12;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes gtBigBlocks {
          0% {
            clip-path: polygon(
              0% 8%,
              100% 8%,
              100% 14%,
              0% 14%,
              0% 42%,
              100% 42%,
              100% 52%,
              0% 52%,
              0% 78%,
              100% 78%,
              100% 84%,
              0% 84%
            );
            transform: translateX(0);
          }
          35% {
            clip-path: polygon(0% 18%, 100% 18%, 100% 28%, 0% 28%, 0% 58%, 100% 58%, 100% 64%, 0% 64%);
            transform: translateX(-24px);
          }
          70% {
            clip-path: polygon(0% 10%, 100% 10%, 100% 16%, 0% 16%, 0% 66%, 100% 66%, 100% 76%, 0% 76%);
            transform: translateX(18px);
          }
          100% {
            clip-path: polygon(
              0% 8%,
              100% 8%,
              100% 14%,
              0% 14%,
              0% 42%,
              100% 42%,
              100% 52%,
              0% 52%,
              0% 78%,
              100% 78%,
              100% 84%,
              0% 84%
            );
            transform: translateX(0);
          }
        }

        /* ===== VARIANT 2 ===== */
        .gt-tearStorm {
          background: repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0) 0px,
              rgba(255, 255, 255, 0) 10px,
              rgba(255, 255, 255, 0.18) 11px,
              rgba(255, 255, 255, 0) 16px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0) 0px,
              rgba(255, 255, 255, 0) 22px,
              rgba(255, 255, 255, 0.14) 23px,
              rgba(255, 255, 255, 0) 30px
            );
          animation: gtTearStorm 0.5s steps(9, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) blur(0.25px) contrast(1.35);
        }
        .gt-pixelBlocks {
          animation: gtPixelBlocks 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.35);
        }
        .gt-noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
          animation: gtNoise 0.5s steps(6, end) infinite;
          mix-blend-mode: overlay;
          filter: grayscale(1) contrast(1.4);
        }
        .gt-flash2 {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
          animation: gtFlash2 0.5s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes gtTearStorm {
          0% {
            transform: translateY(0) translateX(0);
            clip-path: inset(0 0 0 0);
          }
          25% {
            transform: translateY(-22px) translateX(16px);
            clip-path: inset(8% 0 48% 0);
          }
          55% {
            transform: translateY(14px) translateX(-22px);
            clip-path: inset(0 0 62% 0);
          }
          80% {
            transform: translateY(-10px) translateX(10px);
            clip-path: inset(38% 0 0 0);
          }
          100% {
            transform: translateY(0) translateX(0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtPixelBlocks {
          0% {
            clip-path: polygon(
              6% 14%,
              32% 14%,
              32% 30%,
              6% 30%,
              44% 22%,
              78% 22%,
              78% 38%,
              44% 38%,
              12% 58%,
              40% 58%,
              40% 78%,
              12% 78%,
              62% 64%,
              92% 64%,
              92% 84%,
              62% 84%
            );
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          }
          45% {
            clip-path: polygon(
              10% 10%,
              54% 10%,
              54% 26%,
              10% 26%,
              60% 30%,
              94% 30%,
              94% 52%,
              60% 52%,
              6% 62%,
              34% 62%,
              34% 86%,
              6% 86%
            );
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
          }
          100% {
            clip-path: polygon(
              6% 14%,
              32% 14%,
              32% 30%,
              6% 30%,
              44% 22%,
              78% 22%,
              78% 38%,
              44% 38%,
              12% 58%,
              40% 58%,
              40% 78%,
              12% 78%,
              62% 64%,
              92% 64%,
              92% 84%,
              62% 84%
            );
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          }
        }
        @keyframes gtNoise {
          0% {
            transform: translate(0, 0);
            opacity: 0.35;
          }
          50% {
            transform: translate(-10px, 6px);
            opacity: 0.6;
          }
          100% {
            transform: translate(0, 0);
            opacity: 0.45;
          }
        }
        @keyframes gtFlash2 {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          60% {
            opacity: 0.25;
          }
          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        /* ===== VARIANT 3 ===== */
        .gt-crtRoll {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.12) 18%,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0.1) 65%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: gtRoll 0.5s linear infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.35);
        }
        .gt-banding {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 10px,
            rgba(255, 255, 255, 0.2) 12px,
            rgba(255, 255, 255, 0) 16px
          );
          animation: gtBand 0.5s steps(8, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) blur(0.25px) contrast(1.25);
        }
        .gt-chunks {
          animation: gtChunks 0.5s steps(8, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.35);
        }
        .gt-codeInner {
          position: absolute;
          inset: -24px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 11px;
          line-height: 1.15;
          color: rgba(220, 220, 220, 0.75);
          transform: skewY(-6deg);
          animation: gtCodeJitter 0.5s steps(7, end) infinite;
        }
        .gt-codeRow {
          white-space: nowrap;
          opacity: 0.85;
        }
        .gt-vignette {
          background: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.75) 90%);
        }
        @keyframes gtRoll {
          0% {
            transform: translateY(-25%);
          }
          100% {
            transform: translateY(25%);
          }
        }
        @keyframes gtBand {
          0% {
            transform: translateY(0);
            clip-path: inset(0 0 0 0);
          }
          35% {
            transform: translateY(-22px);
            clip-path: inset(0 0 45% 0);
          }
          70% {
            transform: translateY(14px);
            clip-path: inset(30% 0 0 0);
          }
          100% {
            transform: translateY(0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtChunks {
          0% {
            clip-path: polygon(
              0% 18%,
              100% 18%,
              100% 24%,
              0% 24%,
              0% 44%,
              100% 44%,
              100% 60%,
              0% 60%,
              0% 72%,
              100% 72%,
              100% 78%,
              0% 78%
            );
            transform: translateX(0);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
          }
          40% {
            clip-path: polygon(
              0% 10%,
              100% 10%,
              100% 16%,
              0% 16%,
              0% 36%,
              100% 36%,
              100% 52%,
              0% 52%,
              0% 66%,
              100% 66%,
              100% 86%,
              0% 86%
            );
            transform: translateX(-28px);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          }
          80% {
            clip-path: polygon(
              0% 22%,
              100% 22%,
              100% 28%,
              0% 28%,
              0% 58%,
              100% 58%,
              100% 64%,
              0% 64%,
              0% 78%,
              100% 78%,
              100% 84%,
              0% 84%
            );
            transform: translateX(20px);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
          }
          100% {
            clip-path: polygon(
              0% 18%,
              100% 18%,
              100% 24%,
              0% 24%,
              0% 44%,
              100% 44%,
              100% 60%,
              0% 60%,
              0% 72%,
              100% 72%,
              100% 78%,
              0% 78%
            );
            transform: translateX(0);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
          }
        }
        @keyframes gtCodeJitter {
          0% {
            transform: translateX(-12px) translateY(0) skewY(-6deg);
            opacity: 0.4;
          }
          35% {
            transform: translateX(18px) translateY(-10px) skewY(-6deg);
            opacity: 0.85;
          }
          70% {
            transform: translateX(-6px) translateY(8px) skewY(-6deg);
            opacity: 0.6;
          }
          100% {
            transform: translateX(-12px) translateY(0) skewY(-6deg);
            opacity: 0.5;
          }
        }

        /* ===== VARIANT 4 ===== */
        .gt-pulse {
          background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 60%);
          animation: gtPulse 0.5s linear infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.25);
        }
        .gt-slices {
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 8px,
            rgba(255, 255, 255, 0.16) 9px,
            rgba(255, 255, 255, 0) 13px
          );
          animation: gtSlices 0.5s steps(9, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) blur(0.25px) contrast(1.3);
        }
        .gt-shards {
          background: repeating-linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 22px,
            rgba(255, 255, 255, 0.12) 23px,
            rgba(255, 255, 255, 0) 30px
          );
          animation: gtShards 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.25);
        }
        .gt-mosaicBlocks {
          animation: gtMosaicBlocks 0.5s steps(7, end) infinite;
          mix-blend-mode: screen;
          filter: grayscale(1) contrast(1.35);
        }
        @keyframes gtPulse {
          0% {
            transform: scale(0.98);
            opacity: 0.25;
          }
          35% {
            transform: scale(1.02);
            opacity: 0.75;
          }
          70% {
            transform: scale(0.995);
            opacity: 0.4;
          }
          100% {
            transform: scale(0.98);
            opacity: 0.25;
          }
        }
        @keyframes gtSlices {
          0% {
            transform: translateX(0);
            clip-path: inset(0 0 0 0);
          }
          30% {
            transform: translateX(-20px);
            clip-path: inset(12% 0 38% 0);
          }
          60% {
            transform: translateX(14px);
            clip-path: inset(0 0 62% 0);
          }
          100% {
            transform: translateX(0);
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes gtShards {
          0% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-16px);
          }
          75% {
            transform: translateY(10px);
          }
          100% {
            transform: translateY(0);
          }
        }
        @keyframes gtMosaicBlocks {
          0% {
            clip-path: polygon(
              8% 18%,
              28% 18%,
              28% 34%,
              8% 34%,
              40% 12%,
              64% 12%,
              64% 30%,
              40% 30%,
              70% 44%,
              94% 44%,
              94% 62%,
              70% 62%,
              18% 60%,
              46% 60%,
              46% 82%,
              18% 82%
            );
            transform: translateX(0);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          }
          45% {
            clip-path: polygon(
              6% 10%,
              36% 10%,
              36% 26%,
              6% 26%,
              52% 18%,
              86% 18%,
              86% 40%,
              52% 40%,
              10% 52%,
              30% 52%,
              30% 86%,
              10% 86%,
              66% 58%,
              94% 58%,
              94% 84%,
              66% 84%
            );
            transform: translateX(-22px);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
          }
          100% {
            clip-path: polygon(
              8% 18%,
              28% 18%,
              28% 34%,
              8% 34%,
              40% 12%,
              64% 12%,
              64% 30%,
              40% 30%,
              70% 44%,
              94% 44%,
              94% 62%,
              70% 62%,
              18% 60%,
              46% 60%,
              46% 82%,
              18% 82%
            );
            transform: translateX(0);
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
          }
        }
      `}</style>
    </div>
  );
}

function randomHackRow(n: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=-_/\\[]{}<>|";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[(Math.random() * chars.length) | 0];
  return s;
}

/**
 * Everything below is SVG-based so it scales with the card.
 * No fixed pixel boxes => no clipping when the browser shrinks.
 */

function TextDetectorIllustration() {
  return (
    <div className="h-full w-full">
      <svg viewBox="0 0 520 292" className="h-full w-full">
        <rect x="0" y="0" width="520" height="292" rx="26" fill="rgba(0,0,0,0.02)" />
        <g>
          <rect x="28" y="28" width="220" height="236" rx="22" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
          <rect x="52" y="54" width="78" height="26" rx="13" fill="rgba(0,0,0,0.08)" />
          <rect x="52" y="98" width="178" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="52" y="118" width="140" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="52" y="138" width="160" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="52" y="158" width="120" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="52" y="198" width="78" height="24" rx="12" fill="rgba(0,0,0,0.08)" />
          <rect x="138" y="198" width="78" height="24" rx="12" fill="rgba(0,0,0,0.08)" />
        </g>

        <g>
          <rect x="272" y="28" width="220" height="236" rx="22" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
          <rect x="296" y="54" width="98" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="412" y="54" width="56" height="10" rx="5" fill="rgba(0,0,0,0.08)" />

          <rect x="296" y="78" width="172" height="94" rx="14" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <rect x="310" y="92" width="142" height="12" rx="6" fill="rgba(16,185,129,0.25)" />
          <rect x="310" y="114" width="132" height="12" rx="6" fill="rgba(234,179,8,0.25)" />
          <rect x="310" y="136" width="150" height="12" rx="6" fill="rgba(239,68,68,0.25)" />
          <rect x="310" y="158" width="122" height="12" rx="6" fill="rgba(16,185,129,0.25)" />

          <text x="296" y="205" fontSize="12" fill="rgba(0,0,0,0.55)" fontFamily="ui-sans-serif, system-ui">
            AI likelihood
          </text>
          <text x="468" y="205" textAnchor="end" fontSize="12" fill="rgba(0,0,0,0.75)" fontFamily="ui-sans-serif, system-ui">
            41%
          </text>
          <rect x="296" y="215" width="172" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="296" y="215" width="70" height="10" rx="5" fill="rgba(234,179,8,0.70)" />

          <text x="296" y="245" fontSize="12" fill="rgba(16,185,129,0.90)" fontFamily="ui-sans-serif, system-ui">
            Human
          </text>
          <text x="468" y="245" textAnchor="end" fontSize="12" fill="rgba(239,68,68,0.90)" fontFamily="ui-sans-serif, system-ui">
            AI
          </text>
        </g>
      </svg>
    </div>
  );
}

function ImageDetectorIllustration() {
  return (
    <div className="h-full w-full">
      <svg viewBox="0 0 520 292" className="h-full w-full">
        <rect x="0" y="0" width="520" height="292" rx="26" fill="rgba(0,0,0,0.02)" />
        <rect x="32" y="30" width="456" height="232" rx="22" fill="rgba(255,255,255,0.50)" stroke="rgba(0,0,0,0.10)" />
        <rect x="56" y="54" width="120" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
        <rect x="392" y="48" width="76" height="22" rx="11" fill="rgba(0,0,0,0.08)" />
        <g>
          <rect x="56" y="78" width="408" height="118" rx="18" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <circle cx="416" cy="108" r="12" fill="rgba(0,0,0,0.10)" />
          <path d="M72 184 L176 112 L242 170 L286 136 L448 184 Z" fill="rgba(0,0,0,0.10)" />
          <path d="M132 184 L208 132 L260 184 Z" fill="rgba(0,0,0,0.14)" />
          <path d="M176 118 L192 140 L160 140 Z" fill="rgba(255,255,255,0.45)" />
        </g>

        <text x="56" y="226" fontSize="12" fill="rgba(0,0,0,0.55)" fontFamily="ui-sans-serif, system-ui">
          AI likelihood
        </text>
        <text x="464" y="226" textAnchor="end" fontSize="12" fill="rgba(0,0,0,0.75)" fontFamily="ui-sans-serif, system-ui">
          72%
        </text>
        <rect x="56" y="236" width="408" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
        <rect x="56" y="236" width="294" height="10" rx="5" fill="rgba(239,68,68,0.70)" />
        <text x="56" y="262" fontSize="12" fill="rgba(16,185,129,0.90)" fontFamily="ui-sans-serif, system-ui">
          Human
        </text>
        <text x="464" y="262" textAnchor="end" fontSize="12" fill="rgba(239,68,68,0.90)" fontFamily="ui-sans-serif, system-ui">
          AI
        </text>
      </svg>
    </div>
  );
}

function TyperIllustration() {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 520 292" className="h-full w-full">
        <rect x="0" y="0" width="520" height="292" rx="26" fill="rgba(0,0,0,0.02)" />

        <g>
          <rect x="28" y="34" width="230" height="224" rx="22" fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.12)" />
          <rect x="46" y="52" width="194" height="30" rx="12" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
          <circle cx="64" cy="67" r="6" fill="rgba(239,68,68,0.55)" />
          <circle cx="82" cy="67" r="6" fill="rgba(234,179,8,0.55)" />
          <circle cx="100" cy="67" r="6" fill="rgba(16,185,129,0.55)" />
          <text x="124" y="72" fontSize="12" fill="rgba(0,0,0,0.75)" fontFamily="ui-sans-serif, system-ui">
            Ghost Typer
          </text>

          <rect x="46" y="94" width="194" height="54" rx="14" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.10)" />
          <rect x="60" y="108" width="120" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="128" width="162" height="10" rx="5" fill="rgba(0,0,0,0.10)" />

          <rect x="46" y="158" width="194" height="70" rx="14" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.10)" />
          <rect x="60" y="172" width="150" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="192" width="132" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="212" width="164" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
        </g>

        <g>
          <rect x="276" y="34" width="216" height="224" rx="22" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.12)" />
          <rect x="294" y="52" width="180" height="26" rx="12" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <rect x="304" y="60" width="40" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="350" y="60" width="28" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="384" y="60" width="28" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="418" y="60" width="46" height="10" rx="5" fill="rgba(0,0,0,0.10)" />

          <rect x="294" y="92" width="180" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="112" width="168" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="132" width="174" height="10" rx="5" fill="rgba(0,0,0,0.08)" />

          <rect x="294" y="152" width="156" height="12" rx="6" fill="rgba(0,0,0,0.06)" />
          <rect className="gt-type" x="294" y="152" width="0" height="12" rx="6" fill="rgba(0,0,0,0.18)" />
          <rect className="gt-caret" x="294" y="150" width="2" height="16" fill="rgba(0,0,0,0.70)" />

          <rect x="294" y="176" width="142" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="196" width="168" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
        </g>
      </svg>

      <style jsx>{`
        :global(.gt-type) {
          animation: gtTyping 2.4s infinite ease-in-out;
        }
        :global(.gt-caret) {
          animation: gtCaret 2.4s infinite ease-in-out;
        }
        @keyframes gtTyping {
          0% {
            width: 0px;
          }
          55% {
            width: 156px;
          }
          70% {
            width: 156px;
          }
          100% {
            width: 0px;
          }
        }
        @keyframes gtCaret {
          0% {
            transform: translateX(0px);
            opacity: 1;
          }
          55% {
            transform: translateX(156px);
            opacity: 1;
          }
          70% {
            transform: translateX(156px);
            opacity: 0;
          }
          100% {
            transform: translateX(0px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <IntroHero />

        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">Pick a tool to get started.</div>
        </div>

        <div className="mb-3 text-sm font-semibold text-black/70 dark:text-white/70">Featured</div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card href="/detect/text" title="AI Text Detector" subtitle="Check AI probability and sentence highlights.">
            <TextDetectorIllustration />
          </Card>

          <Card href="/detect/image" title="AI Image Detector" subtitle="Analyze images and save results.">
            <ImageDetectorIllustration />
          </Card>

          <Card href="/download" title="Ghost Typer" subtitle="Type anywhere with human-like behavior controls.">
            <TyperIllustration />
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
