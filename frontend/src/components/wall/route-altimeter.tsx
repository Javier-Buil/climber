"use client";

import { useMemo } from "react";
import type { Hold } from "@/lib/api";
import { cn } from "@/lib/cn";
import { KIND_LABEL } from "@/lib/holds";
import { Hint } from "../ui/tooltip";

interface RouteAltimeterProps {
  holds: Hold[];
  length: number;
  selectedId: number | null;
  hoveredId: number | null;
  studied: ReadonlySet<number>;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
}

/**
 * Vertical strip showing every hold by height: hands on the right of the
 * spine, feet on the left, crux zone shaded. Doubles as a quick navigator.
 */
export function RouteAltimeter({ holds, length, selectedId, hoveredId, studied, onSelect, onHover }: RouteAltimeterProps) {
  const top = (y: number) => `${(1 - y / length) * 100}%`;
  const labelStep = length > 20 ? 5 : 1;
  const marks = useMemo(() => {
    const out: number[] = [];
    for (let s = 0; s <= length + 0.01; s += labelStep) out.push(s);
    return out;
  }, [length, labelStep]);

  const crux = holds.filter((h) => h.is_crux);
  const cruxRange = crux.length ? [Math.min(...crux.map((h) => h.y)), Math.max(...crux.map((h) => h.y))] : null;
  const selected = holds.find((h) => h.id === selectedId);

  return (
    <div className="bracketed flex h-full w-[72px] flex-col border border-line bg-ink/70 backdrop-blur-md">
      <div className="border-b border-line px-2 py-1.5 text-center text-[9px] tracking-[0.2em] text-signal uppercase">Alt</div>
      <div className="relative min-h-0 flex-1 my-4 mr-2 ml-7">
        {/* Height scale */}
        {marks.map((s) => (
          <div key={s} className="absolute -left-6 flex -translate-y-1/2 items-center gap-1" style={{ top: top(s) }}>
            <span className="w-4 text-right text-[8px] text-dim tabular-nums">{s}</span>
            <span className="h-px w-1.5 bg-signal/50" />
          </div>
        ))}

        {/* Crux zone */}
        {cruxRange && (
          <div
            className="absolute inset-x-0 border-y border-danger/40 bg-[repeating-linear-gradient(135deg,rgb(255_46_46/0.18)_0_3px,transparent_3px_7px)]"
            style={{ top: top(cruxRange[1] + 0.3), bottom: `${((cruxRange[0] - 0.3) / length) * 100}%` }}
          />
        )}

        {/* Spine */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-signal/10 via-signal/60 to-signal/10" />

        {holds.map((hold) => {
          const foot = hold.usage === "foot";
          const isSelected = hold.id === selectedId;
          const isHovered = hold.id === hoveredId;
          return (
            <button
              key={hold.id}
              type="button"
              aria-label={`Hold ${hold.sequence}, ${KIND_LABEL[hold.kind]} at ${hold.y.toFixed(1)} metres`}
              onClick={() => onSelect(hold.id)}
              onPointerEnter={() => onHover(hold.id)}
              onPointerLeave={() => onHover(null)}
              className={cn(
                "absolute h-[3px] -translate-y-1/2 cursor-pointer transition-[width,background-color]",
                foot ? "right-1/2 mr-0.5" : "left-1/2 ml-0.5",
                isSelected || isHovered ? "w-4" : "w-2.5",
                isSelected
                  ? "bg-white shadow-[0_0_6px_white]"
                  : studied.has(hold.id)
                    ? "bg-[#8dff6a]"
                    : hold.is_crux
                      ? "bg-danger"
                      : foot
                        ? "bg-bone/40 hover:bg-bone"
                        : "bg-signal/80 hover:bg-signal",
              )}
              style={{ top: top(hold.y) }}
            />
          );
        })}

        {selected && (
          <div
            className="pointer-events-none absolute -right-1 flex -translate-y-1/2 items-center transition-[top] duration-500"
            style={{ top: top(selected.y) }}
          >
            <span className="size-0 border-y-4 border-r-4 border-y-transparent border-r-white" />
          </div>
        )}
      </div>
      <Hint label="Click a tick to jump to that hold" side="left">
        <div className="border-t border-line px-2 py-1.5 text-center text-[9px] text-dim tabular-nums">
          {selected ? `${selected.y.toFixed(1)}m` : `${length}m`}
        </div>
      </Hint>
    </div>
  );
}
