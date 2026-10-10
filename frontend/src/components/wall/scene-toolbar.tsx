"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Footprints, Hash, Radar, RotateCcw, ScanLine, Spline, Waves, type LucideIcon } from "lucide-react";
import { HOLD_COLORS } from "@/lib/holds";
import { Hint } from "../ui/tooltip";
import type { SceneLayers } from "./scene/wall-scene";

const LAYERS: { key: keyof SceneLayers; label: string; icon: LucideIcon }[] = [
  { key: "sequence", label: "Sequence path", icon: Spline },
  { key: "feet", label: "Footholds", icon: Footprints },
  { key: "contours", label: "Topo contours", icon: Waves },
  { key: "labels", label: "Hold numbers", icon: Hash },
  { key: "scan", label: "Survey sweep", icon: Radar },
];

const ITEM =
  "flex size-8 cursor-pointer items-center justify-center text-dim outline-none transition-colors hover:text-bone focus-visible:outline-1 focus-visible:outline-signal data-pressed:bg-signal/15 data-pressed:text-signal";

interface SceneToolbarProps {
  layers: SceneLayers;
  onLayersChange: (layers: SceneLayers) => void;
  onFrameWall: () => void;
  onGoToStart: () => void;
}

export function SceneToolbar({ layers, onLayersChange, onFrameWall, onGoToStart }: SceneToolbarProps) {
  const pressed = LAYERS.filter((l) => layers[l.key]).map((l) => l.key);

  return (
    <div className="bracketed flex items-center gap-1 border border-line bg-ink/75 p-1 backdrop-blur-md">
      <ToggleGroup
        multiple
        value={pressed}
        onValueChange={(value) =>
          onLayersChange(Object.fromEntries(LAYERS.map((l) => [l.key, value.includes(l.key)])) as unknown as SceneLayers)
        }
        aria-label="Scene layers"
        className="flex gap-0.5"
      >
        {LAYERS.map(({ key, label, icon: Icon }) => (
          <Hint key={key} label={label}>
            <Toggle value={key} aria-label={label} className={ITEM}>
              <Icon className="size-4" />
            </Toggle>
          </Hint>
        ))}
      </ToggleGroup>

      <span className="mx-1 h-5 w-px bg-line" aria-hidden />

      <Hint label="Frame whole wall">
        <button type="button" onClick={onFrameWall} aria-label="Frame whole wall" className={ITEM}>
          <ScanLine className="size-4" />
        </button>
      </Hint>
      <Hint label="Start of route">
        <button type="button" onClick={onGoToStart} aria-label="Go to start" className={ITEM}>
          <RotateCcw className="size-4" />
        </button>
      </Hint>

      <span className="mx-1 hidden h-5 w-px bg-line xl:block" aria-hidden />

      <div className="hidden items-center gap-3 px-2 text-[9px] tracking-[0.18em] text-dim uppercase xl:flex">
        <LegendDot color={HOLD_COLORS.hand} label="Hand" />
        <LegendDot color={HOLD_COLORS.foot} label="Foot" />
        <LegendDot color={HOLD_COLORS.crux} label="Crux" />
        <LegendDot color="#8dff6a" label="Studied" ring />
      </div>
    </div>
  );
}

function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2 rotate-45"
        style={ring ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}
