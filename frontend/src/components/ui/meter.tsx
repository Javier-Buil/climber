"use client";

import { Progress } from "@base-ui/react/progress";

/** Segmented readiness bar. */
export function ReadinessMeter({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <Progress.Root value={pct} className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Progress.Label className="text-[10px] tracking-[0.18em] text-dim uppercase">{label}</Progress.Label>
        <span className="text-xs text-signal tabular-nums">
          {value}/{max} · <Progress.Value />
        </span>
      </div>
      <Progress.Track className="relative h-2 overflow-hidden border border-line bg-ink">
        <Progress.Indicator className="block h-full bg-[repeating-linear-gradient(90deg,var(--color-signal)_0_6px,transparent_6px_8px)] transition-[width] duration-500" />
      </Progress.Track>
    </Progress.Root>
  );
}
