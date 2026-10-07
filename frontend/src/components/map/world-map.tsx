"use client";

import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { Crosshair, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { SpotSummary } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatLat, formatLon } from "@/lib/holds";
import { Button } from "../ui/button";
import { Hint } from "../ui/tooltip";

type WorldTopology = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

interface WorldMapProps {
  spots: SpotSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Horizontal space (px) covered by an overlay on the right; fly-to centres in the remaining area. */
  rightInset?: number;
}

const MAX_ZOOM = 40;

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function WorldMap({ spots, selectedId, onSelect, rightInset = 0 }: WorldMapProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [world, setWorld] = useState<WorldTopology | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // The atlas is ~750 KB, so it is split out of the main bundle.
  useEffect(() => {
    import("world-atlas/countries-50m.json").then((m) => setWorld(m.default as unknown as WorldTopology));
  }, []);

  const projection = useMemo(() => {
    // Fit the inhabited latitudes rather than the poles, which carry no climbing spots.
    return geoEquirectangular().fitExtent(
      [
        [0, 0],
        [width || 1, height || 1],
      ],
      { type: "MultiPoint", coordinates: [[-180, -58], [180, 84]] },
    );
  }, [width, height]);

  const layers = useMemo(() => {
    if (!world || !width) return null;
    const path = geoPath(projection);
    return {
      land: path(feature(world, world.objects.land)) ?? "",
      borders: path(mesh(world, world.objects.countries, (a, b) => a !== b)) ?? "",
      graticule: path(geoGraticule10()) ?? "",
    };
  }, [world, projection, width]);

  // Wire up d3-zoom once the SVG has a size.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !width) return;
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [-width * 0.25, -height * 0.25],
        [width * 1.25, height * 1.25],
      ])
      .on("zoom", (event) => setTransform(event.transform));
    zoomRef.current = behavior;
    select(svg).call(behavior);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, [width, height]);

  // Fly to the selected spot.
  useEffect(() => {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    const spot = spots.find((s) => s.id === selectedId);
    if (!svg || !behavior || !spot || !width) return;
    const [px, py] = projection([spot.longitude, spot.latitude]) ?? [0, 0];
    const k = 8;
    const cx = (width - rightInset) / 2;
    const target = zoomIdentity.translate(cx, height / 2).scale(k).translate(-px, -py);
    select(svg).transition().duration(1400).call(behavior.transform, target);
  }, [selectedId, spots, projection, width, height, rightInset]);

  const zoomBy = (factor: number) => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(400).call(zoomRef.current.scaleBy, factor);
    }
  };
  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(900).call(zoomRef.current.transform, zoomIdentity);
    }
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const [x, y] = transform.invert([event.clientX - rect.left, event.clientY - rect.top]);
    const coords = projection.invert?.([x, y]);
    if (readoutRef.current && coords) {
      readoutRef.current.textContent = `${formatLat(coords[1])}  ${formatLon(coords[0])}`;
    }
  };

  // The static layers only re-render when the data or viewport changes.
  const staticLayers = useMemo(
    () =>
      layers && (
        <>
          <path d={layers.graticule} fill="none" stroke="rgb(255 107 0 / 0.12)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <path d={layers.land} fill="url(#land-grid)" stroke="none" />
          <path d={layers.borders} fill="none" stroke="rgb(255 107 0 / 0.28)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          <path d={layers.land} fill="none" stroke="#ff6b00" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
        </>
      ),
    [layers],
  );

  const ticks = useMemo(() => {
    if (!width) return { lon: [], lat: [] };
    const step = transform.k >= 12 ? 1 : transform.k >= 4 ? 5 : transform.k >= 2 ? 10 : 30;
    const lon: { x: number; label: string }[] = [];
    const lat: { y: number; label: string }[] = [];
    for (let v = -180; v <= 180; v += step) {
      const [px] = projection([v, 0]) ?? [0, 0];
      const x = transform.applyX(px);
      if (x > 40 && x < width - 40) lon.push({ x, label: `${Math.abs(v)}°${v < 0 ? "W" : v > 0 ? "E" : ""}` });
    }
    for (let v = -80; v <= 80; v += step) {
      const [, py] = projection([0, v]) ?? [0, 0];
      const y = transform.applyY(py);
      if (y > 30 && y < height - 30) lat.push({ y, label: `${Math.abs(v)}°${v < 0 ? "S" : v > 0 ? "N" : ""}` });
    }
    return { lon, lat };
  }, [projection, transform, width, height]);

  return (
    <div ref={containerRef} className="grid-backdrop relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-crosshair touch-none select-none"
        onPointerMove={onPointerMove}
        role="img"
        aria-label="World map of climbing spots"
      >
        <defs>
          {/* Grid fill for landmasses; counter-scaled so the cells keep a constant screen size. */}
          <pattern
            id="land-grid"
            width={7}
            height={7}
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${1 / transform.k})`}
          >
            <rect width={7} height={7} fill="rgb(255 107 0 / 0.06)" />
            <path d="M7 0H0V7" fill="none" stroke="rgb(255 107 0 / 0.45)" strokeWidth={0.6} />
            <rect x={0} y={0} width={1.2} height={1.2} fill="rgb(255 154 77 / 0.9)" />
          </pattern>
          <radialGradient id="marker-glow">
            <stop offset="0%" stopColor="#ff6b00" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity={0} />
          </radialGradient>
        </defs>

        <g transform={transform.toString()}>{staticLayers}</g>

        {spots.map((spot) => {
          const [px, py] = projection([spot.longitude, spot.latitude]) ?? [0, 0];
          const [x, y] = transform.apply([px, py]);
          const selected = spot.id === selectedId;
          const hovered = spot.id === hoveredId;
          const showLabel = selected || hovered || transform.k >= 3;
          return (
            <g
              key={spot.id}
              transform={`translate(${x},${y})`}
              role="button"
              tabIndex={0}
              aria-label={`${spot.name}, ${spot.country}. ${spot.route_count} routes`}
              aria-pressed={selected}
              className="cursor-pointer outline-none [&:focus-visible_.reticle]:stroke-white"
              onClick={() => onSelect(spot.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(spot.id)}
              onPointerEnter={() => setHoveredId(spot.id)}
              onPointerLeave={() => setHoveredId(null)}
            >
              <circle r={selected ? 34 : 22} fill="url(#marker-glow)" />
              <circle r={6} fill="none" stroke="#ff6b00" strokeWidth={1} className="origin-center animate-ping-slow [transform-box:fill-box]" />
              <rect
                className="reticle"
                x={-5}
                y={-5}
                width={10}
                height={10}
                transform="rotate(45)"
                fill={selected ? "#ff6b00" : "#050505"}
                stroke={selected || hovered ? "#ffffff" : "#ff6b00"}
                strokeWidth={1.5}
              />
              {(selected || hovered) && (
                <g stroke="#ff6b00" strokeWidth={1}>
                  <path d="M-18 0h-8M18 0h8M0 -18v-8M0 18v8" />
                  <rect x={-14} y={-14} width={28} height={28} fill="none" strokeDasharray="4 4" />
                </g>
              )}
              {showLabel && (
                <g transform="translate(14,-10)" className="pointer-events-none">
                  <rect
                    x={-2}
                    y={-11}
                    width={spot.name.length * 7.6 + 46}
                    height={26}
                    fill="rgb(5 5 5 / 0.85)"
                    stroke={selected ? "#ff6b00" : "rgb(255 107 0 / 0.35)"}
                  />
                  <text x={4} y={1} className="fill-bone font-sans text-[11px] font-semibold tracking-[0.15em] uppercase">
                    {spot.name}
                  </text>
                  <text x={4} y={11} className="fill-signal font-mono text-[8px] tracking-[0.15em]">
                    {spot.route_count} RTE · {spot.latitude.toFixed(2)},{spot.longitude.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Edge rulers */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 border-b border-line bg-ink/70 text-[9px] text-signal/80">
        {ticks.lon.map((t) => (
          <span key={t.label} className="absolute top-1 -translate-x-1/2 tabular-nums" style={{ left: t.x }}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 border-r border-line bg-ink/70 text-[9px] text-signal/80">
        {ticks.lat.map((t) => (
          <span key={t.label} className="absolute left-1 -translate-y-1/2 tabular-nums" style={{ top: t.y }}>
            {t.label}
          </span>
        ))}
      </div>

      {/* Radar sweep */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-sweep bg-gradient-to-b from-transparent via-signal/[0.05] to-transparent" />

      {!world && (
        <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.3em] text-signal uppercase">
          <span className="animate-blink">Acquiring cartography…</span>
        </div>
      )}

      {/* Status readouts */}
      <div className="pointer-events-none absolute bottom-3 left-11 flex flex-col gap-1 text-[10px] tracking-[0.2em] text-dim uppercase">
        <span>
          Cursor <span ref={readoutRef} className="text-signal tabular-nums" />
        </span>
        <span>
          Zoom <span className="text-signal tabular-nums">{transform.k.toFixed(1)}×</span> · Proj EQR · Datum WGS84
        </span>
      </div>

      <div
        className={cn("absolute bottom-3 flex flex-col gap-1 transition-[right] duration-300")}
        style={{ right: rightInset + 12 }}
      >
        <Hint label="Zoom in" side="left">
          <Button size="icon" variant="outline" className="bg-ink" onClick={() => zoomBy(2)} aria-label="Zoom in">
            <Plus className="size-4" />
          </Button>
        </Hint>
        <Hint label="Zoom out" side="left">
          <Button size="icon" variant="outline" className="bg-ink" onClick={() => zoomBy(0.5)} aria-label="Zoom out">
            <Minus className="size-4" />
          </Button>
        </Hint>
        <Hint label="Reset view" side="left">
          <Button size="icon" variant="outline" className="bg-ink" onClick={resetZoom} aria-label="Reset view">
            <Crosshair className="size-4" />
          </Button>
        </Hint>
      </div>
    </div>
  );
}
