"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { relief, wallPoint, type WallFrame } from "@/lib/wall";
import { SCENE } from "./palette";

const vertexShader = /* glsl */ `
  attribute vec2 wallCoord;
  attribute float reliefValue;
  varying vec2 vWall;
  varying float vRelief;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDepth;
  void main() {
    vWall = wallCoord;
    vRelief = reliefValue;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uSignal;
  uniform vec3 uLightDir;
  uniform vec3 uFogColor;
  uniform float uHalfWidth;
  uniform float uLength;
  uniform float uOuter;
  uniform float uContours;
  uniform float uScan;
  uniform float uTime;
  varying vec2 vWall;
  varying float vRelief;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDepth;

  // Anti-aliased line every \`spacing\` units, \`width\` in pixels.
  float lines(float v, float spacing, float width) {
    float c = v / spacing;
    float w = fwidth(c);
    float d = abs(fract(c - 0.5) - 0.5) / max(w, 1e-4);
    // Fade lines out once cells shrink to a few pixels to avoid moire.
    float fade = 1.0 - smoothstep(0.12, 0.35, w);
    return (1.0 - smoothstep(width * 0.5, width * 0.5 + 1.0, d)) * fade;
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);

    // Rock: soft key light, darker recesses, a faint signal-coloured rim.
    float diffuse = max(dot(n, normalize(uLightDir)), 0.0);
    float cavity = smoothstep(-0.7, 0.7, vRelief);
    vec3 color = uBase * (0.16 + 1.05 * diffuse * diffuse) * mix(0.5, 1.2, cavity);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);

    // The climbing corridor is the focus; the surrounding rock recedes.
    float corridor = 1.0 - smoothstep(uHalfWidth, uHalfWidth + 3.0, abs(vWall.x));
    corridor *= 1.0 - smoothstep(uLength, uLength + 1.5, vWall.y);
    float emphasis = 0.15 + 0.85 * corridor;

    float minor = max(lines(vWall.x, 0.25, 0.6), lines(vWall.y, 0.25, 0.6));
    float major = max(lines(vWall.x, 1.0, 0.9), lines(vWall.y, 1.0, 0.9));
    float bands = lines(vWall.y, 5.0, 1.6) * step(0.0, vWall.y) * step(vWall.y, uLength + 0.01);
    float topo = lines(vRelief, 0.08, 0.8) * uContours;

    // Dashed rails marking the edges of the route corridor.
    float edgeDist = abs(abs(vWall.x) - uHalfWidth) / max(fwidth(vWall.x), 1e-4);
    float rail = (1.0 - smoothstep(0.6, 1.6, edgeDist)) * step(0.45, fract(vWall.y * 1.5));
    rail *= step(0.0, vWall.y) * step(vWall.y, uLength);

    color *= mix(0.4, 1.0, corridor);
    color += uSignal * (minor * 0.035 + major * 0.13) * emphasis;
    color += uSignal * bands * 0.3 * corridor;
    color += uSignal * topo * 0.09 * emphasis;
    color += uSignal * rail * 0.45;
    color += uSignal * rim * 0.12 * emphasis;

    // Survey sweep: a bright line travels up the wall leaving a fading trail.
    float period = 7.0;
    float head = fract(uTime / period) * (uLength + 8.0) - 4.0;
    float d = vWall.y - head;
    float scanLine = exp(-abs(d) * 18.0);
    float trail = d < 0.0 ? exp(d * 0.6) * 0.3 : 0.0;
    color += uSignal * (scanLine * 1.6 + trail * (0.1 + major * 1.2 + topo * 0.6)) * emphasis * uScan;

    // Dissolve the slab's outer edges into the dark instead of a hard rectangle.
    float edge = smoothstep(uOuter, uOuter - 5.0, abs(vWall.x)) * smoothstep(uLength + 4.0, uLength + 0.5, vWall.y);
    float fog = max(smoothstep(45.0, 170.0, vDepth), 1.0 - edge);
    gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  }
`;

export function WallSurface({ frame, contours, scan }: { frame: WallFrame; contours: boolean; scan: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => buildWallGeometry(frame), [frame]);
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color(SCENE.rock) },
      uSignal: { value: new THREE.Color(SCENE.signal) },
      uLightDir: { value: new THREE.Vector3(-0.45, 0.8, 0.55) },
      uFogColor: { value: new THREE.Color(SCENE.background) },
      uHalfWidth: { value: frame.width / 2 },
      uLength: { value: frame.length },
      uOuter: { value: frame.width / 2 + WALL_MARGIN },
      uContours: { value: 1 },
      uScan: { value: 1 },
      uTime: { value: 0 },
    }),
    [frame],
  );

  useFrame(({ clock }, delta) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    // Ease layer toggles instead of popping.
    const k = Math.min(1, delta * 6);
    m.uniforms.uContours.value += ((contours ? 1 : 0) - m.uniforms.uContours.value) * k;
    m.uniforms.uScan.value += ((scan ? 1 : 0) - m.uniforms.uScan.value) * k;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Rock shown either side of the route corridor, in metres. */
const WALL_MARGIN = 11;

function buildWallGeometry(frame: WallFrame): THREE.BufferGeometry {
  const margin = WALL_MARGIN;
  const xMin = -frame.width / 2 - margin;
  const xMax = frame.width / 2 + margin;
  const sMin = -1;
  const sMax = frame.length + 4;
  const density = frame.length > 30 ? 4 : 8; // vertices per metre
  const cols = Math.ceil((xMax - xMin) * density);
  const rows = Math.ceil((sMax - sMin) * density);

  const count = (cols + 1) * (rows + 1);
  const positions = new Float32Array(count * 3);
  const wallCoords = new Float32Array(count * 2);
  const reliefs = new Float32Array(count);
  let i = 0;
  for (let r = 0; r <= rows; r++) {
    const s = sMin + ((sMax - sMin) * r) / rows;
    for (let c = 0; c <= cols; c++) {
      const x = xMin + ((xMax - xMin) * c) / cols;
      positions.set(wallPoint(frame, x, s), i * 3);
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
      indices.push(a, b, d, b, d + 1, d);
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
