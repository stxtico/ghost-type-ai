"use client";

import AppShell from "@/app/_components/AppShell";
import Link from "next/link";

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

export default function HomePage() {
  return (
    <AppShell>
      <main className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Pick a tool to get started.
          </div>
        </div>

        <div className="mb-3 text-sm font-semibold text-black/70 dark:text-white/70">
          Featured
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card
            href="/detect/text"
            title="AI Text Detector"
            subtitle="Check AI probability and sentence highlights."
          >
            <TextDetectorIllustration />
          </Card>

          <Card
            href="/detect/image"
            title="AI Image Detector"
            subtitle="Analyze images and save results."
          >
            <ImageDetectorIllustration />
          </Card>

          <Card
            href="/download"
            title="Ghost Typer"
            subtitle="Type anywhere with human-like behavior controls."
          >
            <TyperIllustration />
          </Card>
        </div>
      </main>
    </AppShell>
  );
}

/**
 * Everything below is SVG-based so it scales with the card.
 * No fixed pixel boxes => no clipping when the browser shrinks.
 */

function TextDetectorIllustration() {
  return (
    <div className="h-full w-full">
      <svg viewBox="0 0 520 292" className="h-full w-full">
        {/* background */}
        <rect x="0" y="0" width="520" height="292" rx="26" fill="rgba(0,0,0,0.02)" />

        {/* left panel */}
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

        {/* right panel */}
        <g>
          <rect x="272" y="28" width="220" height="236" rx="22" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />

          {/* header */}
          <rect x="296" y="54" width="98" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="412" y="54" width="56" height="10" rx="5" fill="rgba(0,0,0,0.08)" />

          {/* highlight box */}
          <rect x="296" y="78" width="172" height="94" rx="14" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <rect x="310" y="92" width="142" height="12" rx="6" fill="rgba(16,185,129,0.25)" />
          <rect x="310" y="114" width="132" height="12" rx="6" fill="rgba(234,179,8,0.25)" />
          <rect x="310" y="136" width="150" height="12" rx="6" fill="rgba(239,68,68,0.25)" />
          <rect x="310" y="158" width="122" height="12" rx="6" fill="rgba(16,185,129,0.25)" />

          {/* meter */}
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

        {/* dark-mode friendliness: a subtle overlay using currentColor-like approach isn't necessary;
            your card already handles dark bg; this is "illustration only". */}
      </svg>
    </div>
  );
}

function ImageDetectorIllustration() {
  return (
    <div className="h-full w-full">
      <svg viewBox="0 0 520 292" className="h-full w-full">
        <rect x="0" y="0" width="520" height="292" rx="26" fill="rgba(0,0,0,0.02)" />

        {/* container */}
        <rect x="32" y="30" width="456" height="232" rx="22" fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.10)" />

        {/* top bar */}
        <rect x="56" y="54" width="120" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
        <rect x="392" y="48" width="76" height="22" rx="11" fill="rgba(0,0,0,0.08)" />

        {/* “mountain thumbnail” */}
        <g>
          <rect x="56" y="78" width="408" height="118" rx="18" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <circle cx="416" cy="108" r="12" fill="rgba(0,0,0,0.10)" />
          <path d="M72 184 L176 112 L242 170 L286 136 L448 184 Z" fill="rgba(0,0,0,0.10)" />
          <path d="M132 184 L208 132 L260 184 Z" fill="rgba(0,0,0,0.14)" />
          <path d="M176 118 L192 140 L160 140 Z" fill="rgba(255,255,255,0.45)" />
        </g>

        {/* meter */}
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

        {/* Left: GhostTyper window */}
        <g>
          <rect x="28" y="34" width="230" height="224" rx="22" fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.12)" />
          {/* window titlebar */}
          <rect x="46" y="52" width="194" height="30" rx="12" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.10)" />
          <circle cx="64" cy="67" r="6" fill="rgba(239,68,68,0.55)" />
          <circle cx="82" cy="67" r="6" fill="rgba(234,179,8,0.55)" />
          <circle cx="100" cy="67" r="6" fill="rgba(16,185,129,0.55)" />
          <text x="124" y="72" fontSize="12" fill="rgba(0,0,0,0.75)" fontFamily="ui-sans-serif, system-ui">
            Ghost Typer
          </text>

          {/* settings blocks */}
          <rect x="46" y="94" width="194" height="54" rx="14" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.10)" />
          <rect x="60" y="108" width="120" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="128" width="162" height="10" rx="5" fill="rgba(0,0,0,0.10)" />

          <rect x="46" y="158" width="194" height="70" rx="14" fill="rgba(255,255,255,0.45)" stroke="rgba(0,0,0,0.10)" />
          <rect x="60" y="172" width="150" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="192" width="132" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="60" y="212" width="164" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
        </g>

        {/* Right: “Google Doc / Word doc” */}
        <g>
          <rect x="276" y="34" width="216" height="224" rx="22" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.12)" />
          {/* doc toolbar */}
          <rect x="294" y="52" width="180" height="26" rx="12" fill="rgba(0,0,0,0.05)" stroke="rgba(0,0,0,0.10)" />
          <rect x="304" y="60" width="40" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="350" y="60" width="28" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="384" y="60" width="28" height="10" rx="5" fill="rgba(0,0,0,0.10)" />
          <rect x="418" y="60" width="46" height="10" rx="5" fill="rgba(0,0,0,0.10)" />

          {/* doc lines */}
          <rect x="294" y="92" width="180" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="112" width="168" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="132" width="174" height="10" rx="5" fill="rgba(0,0,0,0.08)" />

          {/* typing line (animated) */}
          <rect x="294" y="152" width="156" height="12" rx="6" fill="rgba(0,0,0,0.06)" />
          <rect className="gt-type" x="294" y="152" width="0" height="12" rx="6" fill="rgba(0,0,0,0.18)" />
          <rect className="gt-caret" x="294" y="150" width="2" height="16" fill="rgba(0,0,0,0.70)" />

          <rect x="294" y="176" width="142" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="294" y="196" width="168" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
        </g>
      </svg>

      {/* CSS animation applies to the SVG rects */}
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
