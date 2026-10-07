export type RouteStyle = "sport" | "trad" | "boulder";
export type HoldKind =
  | "jug"
  | "crimp"
  | "sloper"
  | "pinch"
  | "pocket"
  | "edge"
  | "undercling"
  | "sidepull"
  | "foothold";
export type HoldUsage = "hand" | "foot" | "both";

export interface SpotSummary {
  id: number;
  slug: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  rock_type: string;
  elevation_m: number;
  description: string;
  route_count: number;
}

export interface RouteSummary {
  id: number;
  name: string;
  grade: string;
  style: RouteStyle;
  length_m: number;
  wall_angle_deg: number;
  hold_count: number;
}

export interface SpotDetail extends Omit<SpotSummary, "route_count"> {
  routes: RouteSummary[];
}

export interface Hold {
  id: number;
  sequence: number;
  x: number;
  y: number;
  kind: HoldKind;
  usage: HoldUsage;
  size_cm: number;
  pull_direction_deg: number;
  is_crux: boolean;
  note: string | null;
}

export interface BetaNote {
  id: number;
  author: string;
  body: string;
  hold_id: number | null;
  created_at: string;
}

export interface RouteDetail {
  id: number;
  name: string;
  grade: string;
  style: RouteStyle;
  length_m: number;
  wall_angle_deg: number;
  wall_width_m: number;
  surface_seed: number;
  first_ascent: string | null;
  description: string;
  spot: Pick<SpotSummary, "id" | "slug" | "name" | "country" | "latitude" | "longitude">;
  holds: Hold[];
  beta_notes: BetaNote[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Requests go through the Next.js rewrite in next.config.ts, so the browser
// only ever talks to its own origin.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail?.detail ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  spots: () => request<SpotSummary[]>("/spots"),
  spot: (id: number) => request<SpotDetail>(`/spots/${id}`),
  route: (id: number) => request<RouteDetail>(`/routes/${id}`),
  addBeta: (routeId: number, note: { author: string; body: string; hold_id: number | null }) =>
    request<BetaNote>(`/routes/${routeId}/beta`, { method: "POST", body: JSON.stringify(note) }),
};
