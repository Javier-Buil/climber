"use client";

import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Line2 } from "three-stdlib";
import type { Hold } from "@/lib/api";
import { wallPoint, type WallFrame } from "@/lib/wall";
import { SCENE } from "./palette";

type Vec3 = [number, number, number];

/** Dashed path through the hand holds, with dashes flowing up the route. */
export function SequencePath({ frame, holds }: { frame: WallFrame; holds: Hold[] }) {
  const dashes = useRef<Line2>(null);
  const points = useMemo(
    () => holds.filter((h) => h.usage !== "foot").map((h) => wallPoint(frame, h.x, h.y, 0.12)),
    [frame, holds],
  );

  useFrame((_, delta) => {
    if (dashes.current) dashes.current.material.dashOffset -= delta * 0.5;
  });

  if (points.length < 2) return null;
  return (
    <group>
      {/* Soft underglow */}
      <Line points={points} color={SCENE.signal} lineWidth={4} transparent opacity={0.07} depthWrite={false} />
      <Line
        ref={dashes}
        points={points}
        color={SCENE.signal}
        lineWidth={1.6}
        dashed
        dashSize={0.3}
        gapSize={0.2}
        toneMapped={false}
      />
    </group>
  );
}

/** Vertical scale beside the corridor with a tick every metre and a label every few. */
export function HeightRuler({ frame }: { frame: WallFrame }) {
  const x = -frame.width / 2 - 1.2;
  const labelStep = frame.length > 20 ? 5 : 1;
  const { spine, ticks, labels } = useMemo(() => {
    const spine: Vec3[] = [wallPoint(frame, x, 0, 0.3), wallPoint(frame, x, frame.length, 0.3)];
    const ticks: Vec3[][] = [];
    const labels: number[] = [];
    for (let s = 0; s <= frame.length + 0.01; s += 1) {
      const major = Math.abs(s % labelStep) < 0.01;
      ticks.push([wallPoint(frame, x, s, 0.3), wallPoint(frame, x - (major ? 0.45 : 0.2), s, 0.3)]);
      if (major) labels.push(s);
    }
    return { spine, ticks, labels };
  }, [frame, x, labelStep]);

  return (
    <group>
      <Line points={spine} color={SCENE.signal} lineWidth={1} transparent opacity={0.7} />
      {ticks.map((points, i) => (
        <Line key={i} points={points} color={SCENE.signal} lineWidth={1} transparent opacity={0.55} />
      ))}
      {labels.map((s) => (
        <Html
          key={s}
          position={wallPoint(frame, x - 0.6, s, 0.3)}
          zIndexRange={[5, 0]}
          style={{ pointerEvents: "none", transform: "translate(-100%, -50%)" }}
        >
          <span className="font-mono text-[9px] whitespace-nowrap text-signal/80 tabular-nums">{s}m</span>
        </Html>
      ))}
    </group>
  );
}

/** Radar-style range arcs on the ground in front of the wall. */
export function RangeRings({ maxRange }: { maxRange: number }) {
  const rings = useMemo(() => {
    const step = maxRange > 30 ? 10 : 5;
    const out: { r: number; points: Vec3[] }[] = [];
    for (let r = step; r <= maxRange; r += step) {
      const points: Vec3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (Math.PI * i) / 64;
        points.push([Math.cos(a) * r, 0.01, Math.sin(a) * r]);
      }
      out.push({ r, points });
    }
    return out;
  }, [maxRange]);

  return (
    <group>
      {rings.map(({ r, points }) => (
        <group key={r}>
          <Line points={points} color={SCENE.signal} lineWidth={1} transparent opacity={0.22} dashed dashSize={0.6} gapSize={0.4} />
          <Html position={[r + 0.3, 0.02, 0.3]} zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
            <span className="font-mono text-[8px] text-signal/50">{r}m</span>
          </Html>
        </group>
      ))}
    </group>
  );
}
