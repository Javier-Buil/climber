"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type BetaNote, type RouteDetail } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useStudied } from "@/lib/use-studied";
import { TopBar } from "../hud/top-bar";
import { ApiOffline } from "../map/world-explorer";
import { ReadinessMeter } from "../ui/meter";
import { Badge, Panel, Stat } from "../ui/panel";
import { Tab, TabList, TabPanel, Tabs } from "../ui/tabs";
import { BetaFeed } from "./beta-feed";
import { HoldDossier } from "./hold-dossier";
import { RouteAltimeter } from "./route-altimeter";
import { WallScene, type SceneLayers } from "./scene/wall-scene";
import { SceneToolbar } from "./scene-toolbar";
import { SequenceList } from "./sequence-list";

export function RouteViewer({ routeId }: { routeId: number }) {
  const { data: route, error, mutate } = useApi(`route:${routeId}`, () => api.route(routeId));

  const addNote = useCallback(
    (note: BetaNote) => mutate((r) => ({ ...r, beta_notes: [note, ...r.beta_notes] })),
    [mutate],
  );

  return (
    <div className="flex h-full flex-col">
      <TopBar
        crumbs={[
          { label: "Earth", href: "/" },
          route ? { label: route.spot.name, href: `/?spot=${route.spot.id}` } : { label: "…" },
          { label: route?.name ?? `Route ${routeId}` },
        ]}
      />
      <main className="relative min-h-0 flex-1 bg-ink">
        {error && (
          <div className="flex h-full items-center justify-center">
            <ApiOffline error={error} />
          </div>
        )}
        {!route && !error && (
          <div className="grid-backdrop flex h-full items-center justify-center">
            <span className="animate-blink text-xs tracking-[0.3em] text-signal uppercase">Reconstructing wall…</span>
          </div>
        )}
        {route && <RouteWorkspace route={route} onNoteAdded={addNote} />}
      </main>
    </div>
  );
}

function RouteWorkspace({ route, onNoteAdded }: { route: RouteDetail; onNoteAdded: (note: BetaNote) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [viewNonce, setViewNonce] = useState(0);
  const [layers, setLayers] = useState<SceneLayers>({
    sequence: true,
    feet: true,
    contours: true,
    labels: false,
    scan: true,
  });
  const { studied, toggle, reset } = useStudied(route.id);
  const telemetry = useRef<HTMLSpanElement>(null);

  const holds = route.holds;
  const selectedIndex = holds.findIndex((h) => h.id === selectedId);
  const selected = selectedIndex >= 0 ? holds[selectedIndex] : null;
  const studiedCount = holds.filter((h) => studied.has(h.id)).length;
  const cruxCount = holds.filter((h) => h.is_crux).length;

  const notesByHold = useMemo(() => {
    const map = new Map<number, BetaNote[]>();
    for (const note of route.beta_notes) {
      if (note.hold_id === null) continue;
      map.set(note.hold_id, [...(map.get(note.hold_id) ?? []), note]);
    }
    return map;
  }, [route.beta_notes]);

  const step = useCallback(
    (delta: number) => {
      const next = selectedIndex < 0 ? (delta > 0 ? 0 : holds.length - 1) : selectedIndex + delta;
      if (next >= 0 && next < holds.length) setSelectedId(holds[next].id);
    },
    [selectedIndex, holds],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "j") step(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "k") step(-1);
      else if (e.key === "Escape") setSelectedId(null);
      else if (e.key === "s" && selectedId !== null) toggle(selectedId);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, toggle, selectedId]);

  const angleLabel =
    route.wall_angle_deg > 0 ? `+${route.wall_angle_deg}°` : route.wall_angle_deg < 0 ? `${route.wall_angle_deg}°` : "0°";

  return (
    <>
      {/* isolate keeps the scene's HTML labels below the HUD panels */}
      <div className="absolute inset-0 isolate">
        <WallScene
          route={route}
          selectedId={selectedId}
          hoveredId={hoveredId}
          studied={studied}
          layers={layers}
          viewNonce={viewNonce}
          telemetryRef={telemetry}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />
      </div>
      <ViewportFrame telemetryRef={telemetry} routeName={route.name} />

      {/* Left: briefing, sequence and beta */}
      <Panel
        title="Route briefing"
        code={`RTE-${String(route.id).padStart(4, "0")}`}
        className="absolute top-3 bottom-3 left-3 w-80"
        bodyClassName="flex flex-col"
      >
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center border border-signal bg-signal/10 font-sans text-xl font-bold text-signal">
              {route.grade}
            </div>
            <div className="min-w-0">
              <h1 className="font-sans text-lg leading-tight font-bold tracking-[0.1em] text-bone uppercase">
                {route.name}
              </h1>
              <p className="text-[10px] tracking-[0.18em] text-dim uppercase">
                {route.spot.name} · {route.spot.country}
              </p>
              <div className="mt-1.5 flex gap-1">
                <Badge tone="signal">{route.style}</Badge>
                {cruxCount > 0 && <Badge tone="danger">{cruxCount} crux holds</Badge>}
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-dim">{route.description}</p>
          <div className="grid grid-cols-3 gap-2 border border-line/60 bg-ink/60 p-2.5">
            <Stat label="Length" value={`${route.length_m} m`} />
            <Stat
              label="Angle"
              value={
                <span className="flex items-center gap-1.5">
                  <AngleGlyph degrees={route.wall_angle_deg} />
                  {angleLabel}
                </span>
              }
            />
            <Stat label="Holds" value={holds.length} />
          </div>
          {route.first_ascent && (
            <p className="text-[10px] tracking-[0.15em] text-dim uppercase">
              FA <span className="text-bone normal-case">{route.first_ascent}</span>
            </p>
          )}
          <ReadinessMeter label="Flash readiness" value={studiedCount} max={holds.length} />
        </div>

        <Tabs defaultValue="sequence" className="flex min-h-0 flex-1 flex-col">
          <TabList>
            <Tab value="sequence">Sequence</Tab>
            <Tab value="beta">Beta · {route.beta_notes.length}</Tab>
          </TabList>
          <TabPanel value="sequence" className="flex flex-col">
            <SequenceList
              holds={holds}
              selectedId={selectedId}
              hoveredId={hoveredId}
              studied={studied}
              notesByHold={notesByHold}
              onSelect={setSelectedId}
              onHover={setHoveredId}
              onToggleStudied={toggle}
            />
            <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10px] tracking-[0.15em] text-faint uppercase">
              <span>←/→ step · S mark · Esc clear</span>
              <button type="button" onClick={reset} className="cursor-pointer text-dim hover:text-signal">
                Reset
              </button>
            </div>
          </TabPanel>
          <TabPanel value="beta" className="flex flex-col">
            <BetaFeed route={route} selected={selected} onSelectHold={setSelectedId} onNoteAdded={onNoteAdded} />
          </TabPanel>
        </Tabs>
      </Panel>

      {/* Right: selected hold */}
      {selected && (
        <HoldDossier
          key={selected.id}
          hold={selected}
          index={selectedIndex}
          total={holds.length}
          studied={studied.has(selected.id)}
          notes={notesByHold.get(selected.id) ?? []}
          onToggleStudied={(value) => toggle(selected.id, value)}
          onStep={step}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Right: altimeter */}
      <div className="absolute top-3 right-3 bottom-3">
        <RouteAltimeter
          holds={holds}
          length={route.length_m}
          selectedId={selectedId}
          hoveredId={hoveredId}
          studied={studied}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />
      </div>

      {/* Bottom: layer toolbar, centred in the free canvas area */}
      <div className="absolute bottom-4 left-[calc(21.5rem+(100%-21.5rem-6rem)/2)] -translate-x-1/2">
        <SceneToolbar
          layers={layers}
          onLayersChange={setLayers}
          onFrameWall={() => setViewNonce((n) => n + 1)}
          onGoToStart={() => setSelectedId(holds[0]?.id ?? null)}
        />
      </div>
    </>
  );
}

/** Corner brackets, centre mark and camera telemetry drawn over the 3D view. */
function ViewportFrame({ telemetryRef, routeName }: { telemetryRef: React.RefObject<HTMLSpanElement | null>; routeName: string }) {
  const corner = "absolute size-5 border-signal/60";
  return (
    <div className="pointer-events-none absolute inset-y-3 right-[6.25rem] left-[21.5rem]" aria-hidden>
      <span className={`${corner} top-0 left-0 border-t border-l`} />
      <span className={`${corner} top-0 right-0 border-t border-r`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} right-0 bottom-0 border-r border-b`} />
      <div className="absolute top-2 left-7 flex items-center gap-2 text-[9px] tracking-[0.22em] text-signal/80 uppercase">
        <span className="size-1.5 animate-blink rounded-full bg-danger" />
        Rec · Wall survey · {routeName}
      </div>
      <span ref={telemetryRef} className="absolute top-2 right-7 text-[9px] tracking-[0.18em] text-dim tabular-nums" />
      <div className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 opacity-40">
        <span className="absolute top-1/2 left-0 h-px w-2 bg-signal" />
        <span className="absolute top-1/2 right-0 h-px w-2 bg-signal" />
        <span className="absolute top-0 left-1/2 h-2 w-px bg-signal" />
        <span className="absolute bottom-0 left-1/2 h-2 w-px bg-signal" />
      </div>
    </div>
  );
}

/** Tiny side-view of the wall: leaning right means overhanging. */
function AngleGlyph({ degrees }: { degrees: number }) {
  const rad = (degrees * Math.PI) / 180;
  const x = 4 + Math.sin(rad) * 10;
  const y = 14 - Math.cos(rad) * 10;
  return (
    <svg viewBox="0 0 18 16" className="h-4 w-4.5" aria-hidden>
      <path d="M1 14.5H17" stroke="currentColor" strokeOpacity={0.35} />
      <path d="M4 4V14" stroke="currentColor" strokeOpacity={0.3} strokeDasharray="1.5 1.5" />
      <path d={`M4 14L${x.toFixed(1)} ${y.toFixed(1)}`} stroke="var(--color-signal)" strokeWidth={1.6} />
    </svg>
  );
}
