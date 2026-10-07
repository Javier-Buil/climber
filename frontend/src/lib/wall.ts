import { fbm } from "./noise";

/**
 * Maps wall-plane coordinates (x across, s along the wall in metres, as
 * returned by the API) to 3D world space.
 *
 * World axes: x to the right, y up, z towards the climber. The wall leans
 * towards the climber by `angleDeg` (positive = overhanging).
 */
export interface WallFrame {
  angle: number;
  seed: number;
  length: number;
  width: number;
}

export function makeWallFrame(angleDeg: number, seed: number, length: number, width: number): WallFrame {
  return { angle: (angleDeg * Math.PI) / 180, seed, length, width };
}

/** Relief offset of the rock along the wall normal, in metres. */
export function relief(frame: WallFrame, x: number, s: number): number {
  const big = fbm(x * 0.12, s * 0.08, frame.seed, 3) * 0.9; // bulges and scoops
  const mid = fbm(x * 0.6, s * 0.6, frame.seed + 17, 4) * 0.18; // features
  const fine = fbm(x * 3.1, s * 3.1, frame.seed + 31, 2) * 0.025; // texture
  return big + mid + fine;
}

export function wallNormal(frame: WallFrame): [number, number, number] {
  return [0, -Math.sin(frame.angle), Math.cos(frame.angle)];
}

export function wallPoint(frame: WallFrame, x: number, s: number, lift = 0): [number, number, number] {
  const d = relief(frame, x, s) + lift;
  const [, ny, nz] = wallNormal(frame);
  return [x, s * Math.cos(frame.angle) + ny * d, s * Math.sin(frame.angle) + nz * d];
}
