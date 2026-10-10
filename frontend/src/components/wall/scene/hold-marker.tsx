"use client";

import { Billboard, Edges, Html, Line } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Hold, HoldKind } from "@/lib/api";
import { KIND_LABEL, holdColor, holdRadius } from "@/lib/holds";
import { wallNormal, wallPoint, type WallFrame } from "@/lib/wall";
import { SCENE } from "./palette";

// Low-poly, faceted shapes read as "scanned" geometry and keep edge outlines clean.
const HOLD_GEOMETRIES: Record<HoldKind, () => THREE.BufferGeometry> = {
  jug: () => new THREE.TorusGeometry(0.8, 0.38, 5, 10, Math.PI).rotateZ(Math.PI),
  crimp: () => new THREE.BoxGeometry(1.8, 0.28, 0.45),
  edge: () => new THREE.BoxGeometry(1.5, 0.4, 0.6),
  sloper: () => new THREE.SphereGeometry(1, 8, 5).scale(1.3, 0.9, 0.45),
  pinch: () => new THREE.CapsuleGeometry(0.38, 1.1, 2, 6),
  pocket: () => new THREE.TorusGeometry(0.6, 0.3, 5, 10),
  undercling: () => new THREE.TorusGeometry(0.8, 0.35, 5, 10, Math.PI),
  sidepull: () => new THREE.BoxGeometry(0.4, 1.5, 0.55),
  foothold: () => new THREE.DodecahedronGeometry(0.75).scale(1.2, 0.7, 0.6),
};

const geometryCache = new Map<HoldKind, THREE.BufferGeometry>();
function holdGeometry(kind: HoldKind): THREE.BufferGeometry {
  let geometry = geometryCache.get(kind);
  if (!geometry) {
    geometry = HOLD_GEOMETRIES[kind]();
    geometryCache.set(kind, geometry);
  }
  return geometry;
}

/**
 * Holds are tiny on a big wall: grow them with camera distance so they stay
 * readable from afar while showing roughly true size up close.
 */
export function distanceScale(camera: THREE.Camera, position: THREE.Vector3): number {
  return THREE.MathUtils.clamp(camera.position.distanceTo(position) / 8, 1, 3.5);
}

export function useHoldTransform(frame: WallFrame, hold: Hold) {
  const radius = holdRadius(hold);
  return useMemo(() => {
    const position = new THREE.Vector3(...wallPoint(frame, hold.x, hold.y, radius * 0.25));
    // Local +z faces out of the wall; spin around it to show the pull direction.
    const normal = new THREE.Vector3(...wallNormal(frame));
    const quaternion = new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
      .multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (hold.pull_direction_deg * Math.PI) / 180),
      );
    return { position, quaternion, radius };
  }, [frame, hold, radius]);
}

interface HoldMarkerProps {
  hold: Hold;
  frame: WallFrame;
  selected: boolean;
  hovered: boolean;
  studied: boolean;
  showLabel: boolean;
  onSelect: (id: number) => void;
  onHover: (id: number | null) => void;
}

export function HoldMarker({ hold, frame, selected, hovered, studied, showLabel, onSelect, onHover }: HoldMarkerProps) {
  const { position, quaternion, radius } = useHoldTransform(frame, hold);
  const color = holdColor(hold);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const focus = useRef(0);

  useFrame(({ camera }, delta) => {
    const g = group.current;
    if (!g) return;
    // Spring towards the hover/selected emphasis.
    focus.current += ((selected ? 1 : hovered ? 0.6 : 0) - focus.current) * Math.min(1, delta * 10);
    g.scale.setScalar(distanceScale(camera, position) * (1 + focus.current * 0.25));
    if (material.current) material.current.emissiveIntensity = 0.5 + focus.current * 2.2;
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(hold.id);
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    onHover(null);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(hold.id);
  };

  const edgeColor = selected ? SCENE.selected : color;

  return (
    <group ref={group} position={position} quaternion={quaternion}>
      <mesh
        geometry={holdGeometry(hold.kind)}
        scale={radius}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          ref={material}
          color="#120c08"
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.35}
          metalness={0.4}
          flatShading
        />
        <Edges threshold={20} color={edgeColor} lineWidth={selected ? 1.6 : 1} />
      </mesh>

      {studied && (
        <mesh position={[0, 0, -radius * 0.2]}>
          <ringGeometry args={[radius * 1.4, radius * 1.52, 24]} />
          <meshBasicMaterial color={SCENE.studied} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}

      {!selected && (hovered || showLabel) && (
        <Html position={[radius * 1.4, radius * 1.4, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div
            className={
              hovered
                ? "border border-signal/70 bg-ink/90 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-bone backdrop-blur"
                : "font-mono text-[9px] text-signal/90"
            }
          >
            {String(hold.sequence).padStart(2, "0")}
            {hovered && <span className="ml-1.5 tracking-[0.15em] text-signal uppercase">{KIND_LABEL[hold.kind]}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Camera-facing targeting brackets locked onto the selected hold. */
export function SelectionReticle({ hold, frame }: { hold: Hold; frame: WallFrame }) {
  const { position, radius } = useHoldTransform(frame, hold);
  const spinner = useRef<THREE.Group>(null);
  const scaler = useRef<THREE.Group>(null);
  const lockIn = useRef(0);

  const brackets = useMemo(() => {
    const s = radius * 2.4;
    const l = s * 0.45;
    return [
      [[-s, -s + l, 0], [-s, -s, 0], [-s + l, -s, 0]],
      [[s - l, -s, 0], [s, -s, 0], [s, -s + l, 0]],
      [[s, s - l, 0], [s, s, 0], [s - l, s, 0]],
      [[-s + l, s, 0], [-s, s, 0], [-s, s - l, 0]],
    ] as [number, number, number][][];
  }, [radius]);

  useFrame(({ camera, clock }, delta) => {
    // Brackets start wide and snap in, then breathe slowly.
    lockIn.current = Math.min(1, lockIn.current + delta * 2.5);
    const ease = 1 - Math.pow(1 - lockIn.current, 3);
    const breathe = 1 + Math.sin(clock.elapsedTime * 3) * 0.04;
    if (scaler.current) scaler.current.scale.setScalar(distanceScale(camera, position) * (2.2 - 1.2 * ease) * breathe);
    if (spinner.current) spinner.current.rotation.z = clock.elapsedTime * 0.6;
  });

  return (
    <Billboard position={position}>
      <group ref={scaler}>
        <group ref={spinner}>
          {brackets.map((points, i) => (
            <Line key={i} points={points} color={SCENE.selected} lineWidth={1.5} toneMapped={false} depthTest={false} renderOrder={10} />
          ))}
        </group>
        <mesh renderOrder={10}>
          <ringGeometry args={[radius * 3.1, radius * 3.18, 48]} />
          <meshBasicMaterial color={SCENE.signal} transparent opacity={0.5} toneMapped={false} depthTest={false} />
        </mesh>
      </group>
    </Billboard>
  );
}
