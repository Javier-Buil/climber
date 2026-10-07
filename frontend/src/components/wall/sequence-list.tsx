"use client";

import { Footprints, Hand, MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import type { BetaNote, Hold } from "@/lib/api";
import { cn } from "@/lib/cn";
import { KIND_LABEL } from "@/lib/holds";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

interface SequenceListProps {
  holds: Hold[];
  selectedId: number | null;
  hoveredId: number | null;
  studied: ReadonlySet<number>;
  notesByHold: Map<number, BetaNote[]>;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
  onToggleStudied: (id: number, value: boolean) => void;
}

export function SequenceList({
  holds,
  selectedId,
  hoveredId,
  studied,
  notesByHold,
  onSelect,
  onHover,
  onToggleStudied,
}: SequenceListProps) {
  const viewport = useRef<HTMLDivElement>(null);

  // Keep the selected row in view when it is chosen from the 3D scene.
  useEffect(() => {
    if (selectedId === null) return;
    viewport.current?.querySelector(`[data-hold="${selectedId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  return (
    <ScrollArea className="flex-1" viewportRef={viewport}>
      <ul>
        {holds.map((hold) => {
          const selected = hold.id === selectedId;
          const noteCount = (notesByHold.get(hold.id)?.length ?? 0) + (hold.note ? 1 : 0);
          const UsageIcon = hold.usage === "foot" ? Footprints : Hand;
          return (
            <li
              key={hold.id}
              data-hold={hold.id}
              onPointerEnter={() => onHover(hold.id)}
              onPointerLeave={() => onHover(null)}
              className={cn(
                "flex items-center gap-2.5 border-b border-line/40 px-3 py-1.5 transition-colors",
                selected ? "bg-signal/20" : hold.id === hoveredId ? "bg-signal/10" : "hover:bg-signal/5",
              )}
            >
              <Checkbox
                checked={studied.has(hold.id)}
                onCheckedChange={(value) => onToggleStudied(hold.id, value)}
                aria-label={`Mark hold ${hold.sequence} as studied`}
              />
              <button
                type="button"
                onClick={() => onSelect(hold.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left outline-none focus-visible:text-signal"
              >
                <span className={cn("w-7 text-[11px] tabular-nums", selected ? "text-signal" : "text-faint")}>
                  {String(hold.sequence).padStart(3, "0")}
                </span>
                <UsageIcon className={cn("size-3.5 shrink-0", hold.usage === "foot" ? "text-dim" : "text-signal")} />
                <span
                  className={cn(
                    "flex-1 truncate text-[11px] tracking-[0.12em] uppercase",
                    hold.is_crux ? "text-danger" : selected ? "text-bone" : "text-bone/80",
                  )}
                >
                  {KIND_LABEL[hold.kind]}
                </span>
                {noteCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-signal/80">
                    <MessageSquare className="size-3" />
                    {noteCount}
                  </span>
                )}
                <span className="w-10 text-right text-[10px] text-dim tabular-nums">{hold.y.toFixed(1)}m</span>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
