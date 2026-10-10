"use client";

import { Input } from "@base-ui/react/input";
import { ChevronRight, Mountain, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type RouteSummary, type SpotSummary } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatLat, formatLon } from "@/lib/holds";
import { useApi } from "@/lib/use-api";
import { TopBar } from "../hud/top-bar";
import { Button } from "../ui/button";
import { inputClassName } from "../ui/field";
import { Badge, Panel, Stat } from "../ui/panel";
import { ScrollArea } from "../ui/scroll-area";
import { WorldMap } from "./world-map";

const DOSSIER_WIDTH = 400;

export function WorldExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("spot")) || null;

  const spots = useApi("spots", api.spots);

  const select = useCallback(
    (id: number | null) => {
      router.replace(id === null ? pathname : `${pathname}?spot=${id}`, { scroll: false });
    },
    [router, pathname],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  const spotList = spots.data ?? [];
  const totalRoutes = spotList.reduce((n, s) => n + s.route_count, 0);

  return (
    <div className="flex h-full flex-col">
      <TopBar
        crumbs={[{ label: "Earth" }]}
        right={
          <span className="hidden lg:inline">
            {spotList.length} sectors · {totalRoutes} routes
          </span>
        }
      />
      <main className="relative min-h-0 flex-1">
        <WorldMap
          spots={spotList}
          selectedId={selectedId}
          onSelect={select}
          rightInset={selectedId ? DOSSIER_WIDTH + 24 : 0}
        />

        <SpotIndex
          spots={spotList}
          loading={spots.loading}
          error={spots.error}
          selectedId={selectedId}
          onSelect={select}
        />

        {selectedId && <SpotDossier key={selectedId} spotId={selectedId} onClose={() => select(null)} />}
      </main>
    </div>
  );
}

function SpotIndex({
  spots,
  loading,
  error,
  selectedId,
  onSelect,
}: {
  spots: SpotSummary[];
  loading: boolean;
  error?: Error;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spots;
    return spots.filter((s) =>
      [s.name, s.country, s.region, s.rock_type].some((field) => field.toLowerCase().includes(q)),
    );
  }, [spots, query]);

  return (
    <Panel
      title="Sectors"
      code={`IDX-${String(spots.length).padStart(3, "0")}`}
      className="absolute top-12 left-14 hidden max-h-[calc(100%-11rem)] w-72 md:flex"
      bodyClassName="flex flex-col"
    >
      <div className="relative border-b border-line p-2">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-dim" />
        <Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search crag, country, rock…"
          aria-label="Search sectors"
          className={cn(inputClassName, "pl-7")}
        />
      </div>
      <ScrollArea className="flex-1">
        {loading && <p className="animate-blink p-3 text-[11px] tracking-[0.2em] text-signal uppercase">Scanning…</p>}
        {error && <ApiOffline error={error} />}
        <ul>
          {filtered.map((spot, i) => (
            <li key={spot.id}>
              <button
                type="button"
                onClick={() => onSelect(spot.id)}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 border-b border-line/50 px-3 py-2 text-left transition-colors hover:bg-signal/10",
                  spot.id === selectedId && "bg-signal/15",
                )}
              >
                <span className="w-6 text-[10px] text-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-sans text-xs font-semibold tracking-[0.12em] uppercase group-hover:text-signal",
                      spot.id === selectedId ? "text-signal" : "text-bone",
                    )}
                  >
                    {spot.name}
                  </span>
                  <span className="block truncate text-[10px] text-dim">
                    {spot.country} · {spot.rock_type}
                  </span>
                </span>
                <span className="text-[10px] text-signal tabular-nums">{spot.route_count}</span>
              </button>
            </li>
          ))}
        </ul>
        {!loading && !error && filtered.length === 0 && (
          <p className="p-3 text-[11px] text-dim">No sector matches “{query}”.</p>
        )}
      </ScrollArea>
    </Panel>
  );
}

function SpotDossier({ spotId, onClose }: { spotId: number; onClose: () => void }) {
  const { data: spot, loading, error } = useApi(`spot:${spotId}`, () => api.spot(spotId));

  return (
    <Panel
      title="Sector dossier"
      code={spot ? `#${spot.slug.toUpperCase()}` : undefined}
      className="absolute top-12 right-6 bottom-6 animate-fade-in"
      bodyClassName="flex flex-col"
      actions={
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close dossier" className="size-6">
          <X className="size-3.5" />
        </Button>
      }
    >
      <div style={{ width: DOSSIER_WIDTH }} className="flex min-h-0 flex-1 flex-col">
        {loading && <p className="animate-blink p-4 text-[11px] tracking-[0.2em] text-signal uppercase">Decrypting…</p>}
        {error && <ApiOffline error={error} />}
        {spot && (
          <>
            <div className="space-y-3 border-b border-line p-4">
              <div>
                <h1 className="font-sans text-2xl font-bold tracking-[0.12em] text-bone uppercase">{spot.name}</h1>
                <p className="text-[11px] tracking-[0.18em] text-signal uppercase">
                  {spot.region} · {spot.country}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-dim">{spot.description}</p>
              <div className="grid grid-cols-2 gap-3 border border-line/60 bg-ink/60 p-3">
                <Stat label="Lat" value={formatLat(spot.latitude)} />
                <Stat label="Lon" value={formatLon(spot.longitude)} />
                <Stat label="Rock" value={spot.rock_type} />
                <Stat label="Elevation" value={`${spot.elevation_m} m`} />
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 text-[10px] tracking-[0.2em] text-dim uppercase">
              <Mountain className="size-3.5 text-signal" />
              Lines on record
              <span className="ml-auto text-signal">{spot.routes.length}</span>
            </div>
            <ScrollArea className="flex-1">
              <ul className="space-y-2 px-4 pb-4">
                {spot.routes.map((route) => (
                  <li key={route.id}>
                    <RouteCard route={route} />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}
      </div>
    </Panel>
  );
}

function RouteCard({ route }: { route: RouteSummary }) {
  const angle =
    route.wall_angle_deg > 0
      ? `${route.wall_angle_deg}° overhang`
      : route.wall_angle_deg < 0
        ? `${-route.wall_angle_deg}° slab`
        : "vertical";
  return (
    <Link
      href={`/routes/${route.id}`}
      className="group bracketed flex items-center gap-3 border border-line bg-ink/70 p-3 transition-colors hover:border-signal hover:bg-signal/10 focus-visible:outline-2 focus-visible:outline-signal"
    >
      <div className="flex size-12 shrink-0 flex-col items-center justify-center border border-signal/60 bg-signal/10">
        <span className="font-sans text-base font-bold text-signal">{route.grade}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-sans text-sm font-semibold tracking-[0.08em] text-bone uppercase group-hover:text-signal">
          {route.name}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="signal">{route.style}</Badge>
          <span className="text-[10px] text-dim tabular-nums">
            {route.length_m} m · {angle} · {route.hold_count} holds
          </span>
        </div>
      </div>
      <ChevronRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-signal" />
    </Link>
  );
}

export function ApiOffline({ error }: { error: Error }) {
  return (
    <div className="m-3 border border-danger/50 bg-danger/10 p-3 text-[11px] leading-relaxed text-danger">
      <p className="font-semibold tracking-[0.2em] uppercase">Uplink lost</p>
      <p className="text-danger/80">{error.message}. Is the FastAPI backend running on port 8000?</p>
    </div>
  );
}
