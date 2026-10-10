"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Hold } from "@/lib/api";
import { wallNormal, wallPoint, type WallFrame } from "@/lib/wall";

interface CameraRigProps {
  frame: WallFrame;
  selected: Hold | null;
  /** Incrementing this re-frames the whole wall. */
  viewNonce: number;
}

export function CameraRig({ frame, selected, viewNonce }: CameraRigProps) {
  const controls = useRef<CameraControls>(null);
  const introduced = useRef(false);
  const normal = useMemo(() => new THREE.Vector3(...wallNormal(frame)), [frame]);

  // Frame the whole wall. The first time, swoop in from high and far away.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const centre = new THREE.Vector3(...wallPoint(frame, 0, frame.length * 0.45));
    const distance = Math.max(9, frame.length * 1.45);
    const eye = centre
      .clone()
      .addScaledVector(normal, distance)
      .add(new THREE.Vector3(distance * 0.3, -frame.length * 0.05, 0));
    eye.y = Math.max(eye.y, 1.6);

    if (!introduced.current) {
      introduced.current = true;
      const start = eye.clone().multiplyScalar(2.2).add(new THREE.Vector3(-distance, distance * 0.8, 0));
      c.setLookAt(start.x, start.y, start.z, centre.x, centre.y, centre.z, false);
    }
    c.setLookAt(eye.x, eye.y, eye.z, centre.x, centre.y, centre.z, true);
  }, [frame, normal, viewNonce]);

  // Glide to the selected hold.
  useEffect(() => {
    const c = controls.current;
    if (!c || !selected) return;
    const target = new THREE.Vector3(...wallPoint(frame, selected.x, selected.y));
    const eye = target.clone().addScaledVector(normal, 4.5).add(new THREE.Vector3(0.9, 0.5, 0));
    c.setLookAt(eye.x, eye.y, eye.z, target.x, target.y, target.z, true);
  }, [selected, frame, normal]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={1}
      maxDistance={180}
      smoothTime={0.7}
      draggingSmoothTime={0.12}
    />
  );
}

/**
 * Writes azimuth / elevation / range of the camera into a DOM node, without
 * re-rendering React every frame.
 */
export function CameraTelemetry({ outputRef }: { outputRef: RefObject<HTMLElement | null> }) {
  const controls = useThree((s) => s.controls) as unknown as CameraControls | null;
  const target = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const tick = useRef(0);

  useFrame(({ camera }) => {
    if (!outputRef.current || !controls || tick.current++ % 4 !== 0) return;
    controls.getTarget(target);
    offset.copy(camera.position).sub(target);
    const range = offset.length();
    const az = (THREE.MathUtils.radToDeg(Math.atan2(offset.x, offset.z)) + 360) % 360;
    const el = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(offset.y / range, -1, 1)));
    outputRef.current.textContent = `AZ ${az.toFixed(0).padStart(3, "0")}°  EL ${el >= 0 ? "+" : "−"}${Math.abs(el)
      .toFixed(0)
      .padStart(2, "0")}°  RNG ${range.toFixed(1).padStart(5, "0")}m`;
  });

  return null;
}
