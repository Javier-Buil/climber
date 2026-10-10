"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { BetaNote, Hold } from "@/lib/api";
import { KIND_LABEL, USAGE_LABEL, holdColor } from "@/lib/holds";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Badge, Panel, Stat } from "../ui/panel";
import { ScrollArea } from "../ui/scroll-area";
import { NoteItem } from "./beta-feed";

interface HoldDossierProps {
  hold: Hold;
  index: number;
  total: number;
  studied: boolean;
  notes: BetaNote[];
  onToggleStudied: (value: boolean) => void;
  onStep: (delta: number) => void;
  onClose: () => void;
}

export function HoldDossier({ hold, index, total, studied, notes, onToggleStudied, onStep, onClose }: HoldDossierProps) {
  return (
    <Panel
      title="Hold intel"
      code={`H-${String(hold.id).padStart(5, "0")}`}
      className="absolute top-3 right-[6.25rem] max-h-[calc(100%-5.5rem)] w-80 animate-fade-in"
      bodyClassName="flex flex-col"
      actions={
        <Button size="icon" variant="ghost" className="size-6" onClick={onClose} aria-label="Close hold intel">
          <X className="size-3.5" />
        </Button>
      }
    >
      <div className="flex items-center gap-4 border-b border-line p-4">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] text-dim uppercase">Move</span>
          <span className="font-sans text-4xl leading-none font-bold text-signal tabular-nums">
            {String(hold.sequence).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-faint tabular-nums">of {total}</span>
        </div>
        <PullDial degrees={hold.pull_direction_deg} color={holdColor(hold)} />
        <div className="ml-auto flex flex-col items-end gap-1">
          <span className="font-sans text-base font-semibold tracking-[0.12em] text-bone uppercase">
            {KIND_LABEL[hold.kind]}
          </span>
          <Badge tone={hold.usage === "foot" ? "default" : "signal"}>{USAGE_LABEL[hold.usage]}</Badge>
          {hold.is_crux && <Badge tone="danger">Crux</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-line p-4">
        <Stat label="Height" value={`${hold.y.toFixed(1)} m`} />
        <Stat label="Offset" value={`${hold.x > 0 ? "+" : ""}${hold.x.toFixed(1)} m`} />
        <Stat label="Size" value={`${hold.size_cm} cm`} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-4">
          {hold.note && (
            <div className="border-l-2 border-signal bg-signal/5 px-3 py-2">
              <p className="text-[10px] tracking-[0.2em] text-signal uppercase">Route log</p>
              <p className="text-xs leading-relaxed text-bone">{hold.note}</p>
            </div>
          )}
          {notes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.2em] text-dim uppercase">Team beta</p>
              {notes.map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
            </div>
          )}
          {!hold.note && notes.length === 0 && (
            <p className="text-[11px] text-faint">No intel on this hold yet. Add beta from the Beta tab.</p>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t border-line p-3">
        <label className="flex flex-1 cursor-pointer items-center gap-2 text-[11px] tracking-[0.15em] text-dim uppercase">
          <Checkbox checked={studied} onCheckedChange={onToggleStudied} aria-label="Studied" />
          Studied
        </label>
        <Button size="icon" onClick={() => onStep(-1)} disabled={index <= 0} aria-label="Previous hold">
          <ChevronLeft className="size-4" />
        </Button>
        <Button size="icon" onClick={() => onStep(1)} disabled={index >= total - 1} aria-label="Next hold">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </Panel>
  );
}

/** Compass-style dial showing which way the hold wants to be pulled. 0° = straight down. */
function PullDial({ degrees, color }: { degrees: number; color: string }) {
  return (
    <svg viewBox="-30 -30 60 60" className="size-16" role="img" aria-label={`Pull direction ${Math.round(degrees)} degrees`}>
      <circle r={26} fill="none" stroke="rgb(255 107 0 / 0.3)" strokeDasharray="2 3" />
      <circle r={16} fill="none" stroke="rgb(255 107 0 / 0.15)" />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} y1={-26} y2={-21} stroke="rgb(255 107 0 / 0.6)" transform={`rotate(${a})`} />
      ))}
      <g transform={`rotate(${degrees})`}>
        <line y1={-8} y2={20} stroke={color} strokeWidth={2} />
        <path d="M-5 15 0 23 5 15Z" fill={color} />
      </g>
      <circle r={3} fill="#050505" stroke={color} />
      <text y={-14} textAnchor="middle" className="fill-dim font-mono text-[6px]">
        PULL
      </text>
    </svg>
  );
}
