"use client";

export default function TokenBar({
  label,
  used,
  limit,
  unit = "words",
}: {
  label: string;
  used: number;
  limit: number;
  unit?: "words" | "images";
}) {
  const safeLimit = Math.max(0, Number(limit || 0));
  const safeUsed = Math.max(0, Number(used || 0));
  const remaining = Math.max(0, safeLimit - safeUsed);

  const pct = safeLimit === 0 ? 0 : Math.max(0, Math.min(100, (remaining / safeLimit) * 100));

  // green -> yellow -> red
  const color =
    pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="text-white/80">{label}</div>
        <div className="text-white/60">
          {remaining} / {safeLimit} {unit}
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
