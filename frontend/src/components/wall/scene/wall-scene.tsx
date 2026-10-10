"use client";

import { Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useMemo, type RefObject } from "react";
import type { RouteDetail } from "@/lib/api";
import { makeWallFrame } from "@/lib/wall";
import { CameraRig, CameraTelemetry } from "./camera-rig";
import { HoldMarker, SelectionReticle } from "./hold-marker";
import { HeightRuler, RangeRings, SequencePath } from "./overlays";
import { SCENE } from "./palette";
import { WallSurface } from "./wall-surface";

export interface SceneLayers {
  sequence: boolean;
  feet: boolean;
  contours: boolean;
  labels: boolean;
  scan: boolean;
}

interface WallSceneProps {
  route: RouteDetail;
  selectedId: number | null;
  hoveredId: number | null;
  studied: ReadonlySet<number>;
  layers: SceneLayers;
  /** Incrementing this re-frames the whole wall. */
  viewNonce: number;
  /** DOM node that receives the live camera telemetry readout. */
  telemetryRef: RefObject<HTMLElement | null>;
  onSelect: (id: number | null) => void;
  onHover: (id: number | null) => void;
}

export function WallScene(props: WallSceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 42, near: 0.1, far: 500, position: [0, 10, 40] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={[SCENE.background]} />
      <fog attach="fog" args={[SCENE.background, 45, 170]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-12, 30, 25]} intensity={1.4} color="#ffd9b8" />
      <directionalLight position={[15, 5, 10]} intensity={0.5} color={SCENE.signal} />
      <Scene {...props} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.25} intensity={1.1} radius={0.65} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.25} />
        <Vignette offset={0.28} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}

function Scene({ route, selectedId, hoveredId, studied, layers, viewNonce, telemetryRef, onSelect, onHover }: WallSceneProps) {
  const frame = useMemo(
    () => makeWallFrame(route.wall_angle_deg, route.surface_seed, route.length_m, route.wall_width_m),
    [route],
  );
  const visibleHolds = useMemo(
    () => route.holds.filter((h) => layers.feet || h.usage !== "foot" || h.id === selectedId),
    [route.holds, layers.feet, selectedId],
  );
  const selected = route.holds.find((h) => h.id === selectedId) ?? null;

  return (
    <>
      <CameraRig frame={frame} selected={selected} viewNonce={viewNonce} />
      <CameraTelemetry outputRef={telemetryRef} />
      <WallSurface frame={frame} contours={layers.contours} scan={layers.scan} />
      <HeightRuler frame={frame} />
      <RangeRings maxRange={Math.max(10, Math.ceil(route.length_m / 10) * 10)} />
      <Grid
        position={[0, -0.01, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a1406"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#7a3300"
        fadeDistance={80}
        fadeStrength={2}
        infiniteGrid
      />
      {layers.sequence && <SequencePath frame={frame} holds={route.holds} />}
      {visibleHolds.map((hold) => (
        <HoldMarker
          key={hold.id}
          hold={hold}
          frame={frame}
          selected={hold.id === selectedId}
          hovered={hold.id === hoveredId}
          studied={studied.has(hold.id)}
          showLabel={layers.labels && hold.usage !== "foot"}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      {selected && <SelectionReticle key={selected.id} hold={selected} frame={frame} />}
    </>
  );
}
