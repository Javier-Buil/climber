# Climber // Recon

Study a wall before you try to flash it. Pick a crag on a tactical world map,
choose a route, and inspect every hold of the line in 3D: its type, size,
pull direction, crux flags and the beta your partners left on it. Tick holds
off as you study them to track your "flash readiness".

```
climber/
├── backend/    FastAPI + SQLModel + SQLite (spots, routes, holds, beta notes)
└── frontend/   Next.js 16 + three.js (react-three-fiber) + Base UI + Tailwind v4
```

## Quick start

You need Python 3.11+ with [uv](https://docs.astral.sh/uv/), and Node 20+.

```bash
# 1. API on http://localhost:8000 (creates and seeds climber.db on first start)
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# 2. Web app on http://localhost:3000
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to the backend (see `frontend/next.config.ts`).
Set `BACKEND_URL` if the API runs somewhere other than `http://127.0.0.1:8000`.

Interactive API docs are at http://localhost:8000/docs.

## Backend

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/api/spots`                  | All spots with coordinates and route counts  |
| GET    | `/api/spots/{id}`             | One spot and a summary of its routes         |
| GET    | `/api/routes/{id}`            | Route with ordered holds and beta notes      |
| POST   | `/api/routes/{id}/beta`       | Add a beta note, optionally pinned to a hold |

Data model (`backend/app/models.py`):

- **Spot**: name, country, region, latitude/longitude, rock type, elevation.
- **Route**: grade, style (sport/trad/boulder), length, wall angle
  (positive = overhanging), wall width and a seed for the procedural rock surface.
- **Hold**: sequence number, position on the wall plane (`x` across from the
  centre line, `y` up the wall, in metres), kind (jug, crimp, sloper, ...),
  usage (hand/foot), size, pull direction, crux flag and an optional note.
- **BetaNote**: author, text, optional hold.

Config via env vars: `DATABASE_URL` (default `sqlite:///backend/climber.db`)
and `CORS_ORIGINS` (default `http://localhost:3000`).

Run the tests with `uv run pytest`.

> **Sample data.** Spot coordinates are real. Route names, grades and first
> ascents are given for flavour, but every hold layout is procedurally
> generated (`backend/app/seed.py`). It is not real beta. Delete `climber.db`
> to reseed.

## Frontend

- **World map** (`src/components/map`): equirectangular projection with
  `d3-geo`, Natural Earth land from `world-atlas`, gridded land fill,
  graticule rulers, pan/zoom with `d3-zoom`, and fly-to on selection. The
  selected spot lives in the URL (`/?spot=3`), so the dossier survives
  navigation.
- **Route viewer** (`src/components/wall`): the rock is a mesh displaced with
  seeded fractal noise (`src/lib/wall.ts`) and rendered by a custom shader that
  draws a 1 m tactical grid and topographic contour lines. Holds are shaped
  by kind, coloured by role (hand, foot, crux), rotated to their pull
  direction, and scale up with camera distance so they stay visible on long
  routes. Click a hold, or use the sequence list, to fly the camera to it.
- **UI kit** (`src/components/ui`): headless
  [Base UI](https://base-ui.com) primitives (Tabs, Switch, Checkbox, Tooltip,
  ScrollArea, Progress, Field, Input) styled with Tailwind in the orange/black
  HUD theme defined in `src/app/globals.css`.

Keyboard on the route page: `←`/`→` step through holds, `S` marks the
selected hold as studied, `Esc` clears the selection. Study progress is kept
in `localStorage` per route.
