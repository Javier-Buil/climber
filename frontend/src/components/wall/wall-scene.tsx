"use client";

import { CameraControls, Grid, Html, Line } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Hold, HoldKind, RouteDetail } from "@/lib/api";
import { HOLD_COLORS, KIND_LABEL, holdColor, holdRadius } from "@/lib/holds";
import { makeWallFrame, relief, wallNormal, wallPoint, type WallFrame } from "@/lib/wall";

export interface SceneLayers {
  sequence: boolean;
  feet: boolean;
  contours: boolean;
  labels: boolean;
}

interface WallSceneProps {
  route: RouteDetail;
  selectedId: number | null;
  hoveredId: number | null;
  studied: ReadonlySet<number>;
  layers: SceneLayers;
  /** Incrementing this re-frames the whole wall. */
  viewNonce: number;
  onSelect: (id: number | null) => void;
  onHover: (id: number | null) => void;
}

const BACKGROUND = "#050505";

export function WallScene(props: WallSceneProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 500, position: [0, 10, 40] }}
      gl={{ antialias: true }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 40, 160]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-12, 30, 25]} intensity={1.6} color="#ffd2ad" />
      <directionalLight position={[15, 5, 10]} intensity={0.4} color="#ff6b00" />
      <Scene {...props} />
    </Canvas>
  );
}

function Scene({ route, selectedId, hoveredId, studied, layers, viewNonce, onSelect, onHover }: WallSceneProps) {
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
      <WallMesh frame={frame} contours={layers.contours} />
      <HeightRuler frame={frame} />
      <Grid
        position={[0, -0.01, 0]}
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#3b1c06"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#ff6b00"
        fadeDistance={90}
        fadeStrength={1.5}
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
    </>
  );
}

// --- Camera -------------------------------------------------------------------

function CameraRig({ frame, selected, viewNonce }: { frame: WallFrame; selected: Hold | null; viewNonce: number }) {
  const controls = useRef<CameraControls>(null);
  const normal = useMemo(() => new THREE.Vector3(...wallNormal(frame)), [frame]);

  // Frame the whole wall on load and when asked to reset.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const centre = new THREE.Vector3(...wallPoint(frame, 0, frame.length / 2));
    const distance = Math.max(8, frame.length * 1.5);
    const eye = centre.clone().addScaledVector(normal, distance).add(new THREE.Vector3(distance * 0.25, -frame.length * 0.1, 0));
    eye.y = Math.max(eye.y, 1.6);
    c.setLookAt(eye.x, eye.y, eye.z, centre.x, centre.y, centre.z, viewNonce > 0);
  }, [frame, normal, viewNonce]);

  // Glide to the selected hold, keeping the current viewing angle where possible.
  useEffect(() => {
    const c = controls.current;
    if (!c || !selected) return;
    const target = new THREE.Vector3(...wallPoint(frame, selected.x, selected.y));
    const eye = target.clone().addScaledVector(normal, 4.5).add(new THREE.Vector3(0.8, 0.6, 0));
    c.setLookAt(eye.x, eye.y, eye.z, target.x, target.y, target.z, true);
  }, [selected, frame, normal]);

  return <CameraControls ref={controls} makeDefault minDistance={1} maxDistance={180} smoothTime={0.6} />;
}

// --- Wall surface -------------------------------------------------------------

const wallVertex = /* glsl */ `
  attribute vec2 wallCoord;
  attribute float reliefValue;
  varying vec2 vWall;
  varying float vRelief;
  varying vec3 vNormal;
  varying float vDepth;
  void main() {
    vWall = wallCoord;
    vRelief = reliefValue;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const wallFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uGrid;
  uniform vec3 uLightDir;
  uniform vec3 uFogColor;
  uniform float uHalfWidth;
  uniform float uLength;
  uniform float uContours;
  varying vec2 vWall;
  varying float vRelief;
  varying vec3 vNormal;
  varying float vDepth;

  float gridLine(vec2 coord, float spacing) {
    vec2 c = coord / spacing;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }

  float isoLine(float v, float spacing) {
    float c = v / spacing;
    float g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(g, 1.0);
  }

  void main() {
    vec3 n = normalize(vNormal);
    float diffuse = max(dot(n, normalize(uLightDir)), 0.0);
    vec3 color = uBase * (0.25 + 1.3 * diffuse * diffuse);

    // The climbing corridor is lit up, the surrounding rock fades out.
    float corridor = 1.0 - smoothstep(uHalfWidth, uHalfWidth + 2.5, abs(vWall.x));
    corridor *= 1.0 - smoothstep(uLength, uLength + 2.0, vWall.y);
    float major = gridLine(vWall, 1.0);
    float minor = gridLine(vWall, 0.25);
    float topo = isoLine(vRelief, 0.08) * uContours;

    color += uGrid * (major * 0.5 + minor * 0.12) * (0.25 + 0.75 * corridor);
    color += uGrid * topo * 0.35 * (0.3 + 0.7 * corridor);
    color += uGrid * 0.025 * corridor;

    float fog = smoothstep(40.0, 160.0, vDepth);
    gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  }
`;

function WallMesh({ frame, contours }: { frame: WallFrame; contours: boolean }) {
  const geometry = useMemo(() => buildWallGeometry(frame), [frame]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: wallVertex,
        fragmentShader: wallFragment,
        uniforms: {
          uBase: { value: new THREE.Color("#2b241d") },
          uGrid: { value: new THREE.Color(HOLD_COLORS.hand) },
          uLightDir: { value: new THREE.Vector3(-0.4, 0.8, 0.6) },
          uFogColor: { value: new THREE.Color(BACKGROUND) },
          uHalfWidth: { value: frame.width / 2 },
          uLength: { value: frame.length },
          uContours: { value: contours ? 1 : 0 },
        },
        side: THREE.DoubleSide,
      }),
    [frame, contours],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <mesh geometry={geometry} material={material} />;
}

function buildWallGeometry(frame: WallFrame): THREE.BufferGeometry {
  const margin = 6;
  const xMin = -frame.width / 2 - margin;
  const xMax = frame.width / 2 + margin;
  const sMin = -1;
  const sMax = frame.length + 3;
  const density = frame.length > 30 ? 4 : 8; // vertices per metre
  const cols = Math.ceil((xMax - xMin) * density);
  const rows = Math.ceil((sMax - sMin) * density);

  const positions = new Float32Array((cols + 1) * (rows + 1) * 3);
  const wallCoords = new Float32Array((cols + 1) * (rows + 1) * 2);
  const reliefs = new Float32Array((cols + 1) * (rows + 1));
  let i = 0;
  for (let r = 0; r <= rows; r++) {
    const s = sMin + ((sMax - sMin) * r) / rows;
    for (let c = 0; c <= cols; c++) {
      const x = xMin + ((xMax - xMin) * c) / cols;
      const [px, py, pz] = wallPoint(frame, x, s);
      positions.set([px, py, pz], i * 3);
      wallCoords.set([x, s], i * 2);
      reliefs[i] = relief(frame, x, s);
      i++;
    }
  }

  const indices: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + 1;
      const d = a + cols + 1;
      const e = d + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("wallCoord", new THREE.BufferAttribute(wallCoords, 2));
  geometry.setAttribute("reliefValue", new THREE.BufferAttribute(reliefs, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// --- Holds --------------------------------------------------------------------

const HOLD_GEOMETRIES: Record<HoldKind, () => THREE.BufferGeometry> = {
  jug: () => new THREE.TorusGeometry(0.8, 0.38, 8, 16, Math.PI).rotateZ(Math.PI),
  crimp: () => new THREE.BoxGeometry(1.8, 0.28, 0.45),
  edge: () => new THREE.BoxGeometry(1.5, 0.4, 0.6),
  sloper: () => new THREE.SphereGeometry(1, 16, 10).scale(1.3, 0.9, 0.45),
  pinch: () => new THREE.CapsuleGeometry(0.38, 1.1, 4, 10),
  pocket: () => new THREE.TorusGeometry(0.6, 0.3, 8, 16),
  undercling: () => new THREE.TorusGeometry(0.8, 0.35, 8, 16, Math.PI),
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

function HoldMarker({ hold, frame, selected, hovered, studied, showLabel, onSelect, onHover }: HoldMarkerProps) {
  const radius = holdRadius(hold);
  const color = holdColor(hold);
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  const { position, quaternion } = useMemo(() => {
    const position = new THREE.Vector3(...wallPoint(frame, hold.x, hold.y, radius * 0.25));
    // Local +z faces out of the wall; spin around it to show the pull direction.
    const normal = new THREE.Vector3(...wallNormal(frame));
    const quaternion = new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (hold.pull_direction_deg * Math.PI) / 180));
    return { position, quaternion };
  }, [frame, hold, radius]);

  useFrame(({ clock, camera }) => {
    // Holds are tiny on a big wall: grow them with distance so they stay
    // readable from afar, and show true(ish) size up close.
    if (group.current) {
      const distance = camera.position.distanceTo(group.current.position);
      group.current.scale.setScalar(Math.min(Math.max(distance / 8, 1), 3.5));
    }
    if (ring.current) {
      const pulse = 1 + 0.25 * Math.sin(clock.elapsedTime * 4);
      ring.current.scale.setScalar(pulse);
    }
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

  const emphasis = selected ? 1.6 : hovered ? 1 : 0.35;

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
          color={selected ? HOLD_COLORS.selected : color}
          emissive={color}
          emissiveIntensity={emphasis}
          roughness={0.6}
          flatShading
        />
      </mesh>

      {studied && (
        <mesh position={[0, 0, -radius * 0.2]}>
          <ringGeometry args={[radius * 1.35, radius * 1.5, 32]} />
          <meshBasicMaterial color="#9dff7a" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {selected && (
        <mesh ref={ring} position={[0, 0, -radius * 0.1]}>
          <ringGeometry args={[radius * 1.8, radius * 2, 4]} />
          <meshBasicMaterial color={HOLD_COLORS.selected} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {(selected || hovered || showLabel) && (
        <Html
          position={[radius * 1.4, radius * 1.4, 0]}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={
              selected || hovered
                ? "border border-signal bg-ink/90 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-bone"
                : "font-mono text-[9px] text-signal/90"
            }
          >
            #{hold.sequence}
            {(selected || hovered) && (
              <span className="ml-1.5 tracking-[0.15em] text-signal uppercase">{KIND_LABEL[hold.kind]}</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// --- Overlays -----------------------------------------------------------------

function SequencePath({ frame, holds }: { frame: WallFrame; holds: Hold[] }) {
  const points = useMemo(
    () =>
      holds
        .filter((h) => h.usage !== "foot")
        .map((h) => new THREE.Vector3(...wallPoint(frame, h.x, h.y, 0.12))),
    [frame, holds],
  );
  if (points.length < 2) return null;
  return <Line points={points} color={HOLD_COLORS.hand} lineWidth={1.5} dashed dashSize={0.25} gapSize={0.18} transparent opacity={0.85} />;
}

function HeightRuler({ frame }: { frame: WallFrame }) {
  const x = -frame.width / 2 - 1.5;
  const step = frame.length > 20 ? 5 : 1;
  const marks = useMemo(() => {
    const out: number[] = [];
    for (let s = 0; s <= frame.length + 0.01; s += step) out.push(s);
    return out;
  }, [frame.length, step]);
  const points = useMemo(() => [wallPoint(frame, x, 0, 0.3), wallPoint(frame, x, frame.length, 0.3)], [frame, x]);

  return (
    <group>
      <Line points={points} color={HOLD_COLORS.hand} lineWidth={1} transparent opacity={0.6} />
      {marks.map((s) => (
        <Html key={s} position={wallPoint(frame, x - 0.3, s, 0.3)} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <span className="font-mono text-[9px] whitespace-nowrap text-signal/80">{s}m —</span>
        </Html>
      ))}
    </group>
  );
}
