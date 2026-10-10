import { HOLD_COLORS } from "@/lib/holds";

/** Colours used inside the WebGL scene. Kept in one place so the HUD and 3D agree. */
export const SCENE = {
  background: "#040404",
  rock: "#2a231c",
  signal: HOLD_COLORS.hand,
  studied: "#8dff6a",
  ...HOLD_COLORS,
} as const;
