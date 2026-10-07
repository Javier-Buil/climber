import type { Hold, HoldKind, HoldUsage } from "./api";

export const KIND_LABEL: Record<HoldKind, string> = {
  jug: "Jug",
  crimp: "Crimp",
  sloper: "Sloper",
  pinch: "Pinch",
  pocket: "Pocket",
  edge: "Edge",
  undercling: "Undercling",
  sidepull: "Sidepull",
  foothold: "Foothold",
};

export const USAGE_LABEL: Record<HoldUsage, string> = {
  hand: "Hand",
  foot: "Foot",
  both: "Hand / Foot",
};

export const HOLD_COLORS = {
  hand: "#ff6b00",
  foot: "#d9cfc1",
  crux: "#ff2e2e",
  selected: "#ffffff",
} as const;

export function holdColor(hold: Hold): string {
  if (hold.is_crux) return HOLD_COLORS.crux;
  return hold.usage === "foot" ? HOLD_COLORS.foot : HOLD_COLORS.hand;
}

/** Visual radius in metres. Real holds are tiny on a 40 m wall, so we exaggerate. */
export function holdRadius(hold: Hold): number {
  return 0.07 + Math.min(hold.size_cm, 25) * 0.007;
}

export function formatCoord(value: number, pos: string, neg: string): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg.toString().padStart(2, "0")}°${min.toFixed(2).padStart(5, "0")}'${value >= 0 ? pos : neg}`;
}

export const formatLat = (v: number) => formatCoord(v, "N", "S");
export const formatLon = (v: number) => formatCoord(v, "E", "W");
