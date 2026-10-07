"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

export const TooltipProvider = Tooltip.Provider;

/** Wraps a single interactive element with a HUD-styled tooltip. */
export function Hint({ label, children, side = "top" }: { label: ReactNode; children: ReactElement; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} delay={250} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={8}>
          <Tooltip.Popup className="border border-signal/60 bg-ink px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-signal uppercase shadow-[0_0_12px_rgb(255_107_0/0.25)] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
