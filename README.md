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

```
backend/
├── app/
│   ├── main.py              App factory: CORS, lifespan (create + seed DB), routers
│   ├── core/config.py       Settings (pydantic-settings, env vars or backend/.env)
│   ├── api/
│   │   ├── deps.py          Shared dependencies (DB session)
│   │   └── v1/
│   │       ├── router.py    Mounts every v1 endpoint under /api/v1
│   │       └── endpoints/   spots.py, routes.py
│   ├── models/              SQLModel tables: spot, route, hold, beta_note, enums
│   ├── schemas/             Request/response bodies
│   ├── services/            Query and business logic, no HTTP details
│   └── db/
│       ├── session.py       Engine and session dependency
│       ├── seed.py          Procedural hold generation and seeding
│       └── seed_data.py     Sample spots, routes and beta text
└── tests/                   Mirrors app/ (tests/api/v1/...)
```

| Method | Path                             | Description                                  |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/health`                        | Liveness check (unversioned)                 |
| GET    | `/api/v1/spots`                  | All spots with coordinates and route counts  |
| GET    | `/api/v1/spots/{id}`             | One spot and a summary of its routes         |
| GET    | `/api/v1/routes/{id}`            | Route with ordered holds and beta notes      |
| POST   | `/api/v1/routes/{id}/beta`       | Add a beta note, optionally pinned to a hold |

A future breaking change goes in `app/api/v2/` with its own router, mounted
next to v1 in `main.py`.

Data model (`backend/app/models/`):

- **Spot**: name, country, region, latitude/longitude, rock type, elevation.
- **Route**: grade, style (sport/trad/boulder), length, wall angle
  (positive = overhanging), wall width and a seed for the procedural rock surface.
- **Hold**: sequence number, position on the wall plane (`x` across from the
  centre line, `y` up the wall, in metres), kind (jug, crimp, sloper, ...),
  usage (hand/foot), size, pull direction, crux flag and an optional note.
- **BetaNote**: author, text, optional hold.

Settings live in `app/core/config.py` (pydantic-settings). Each field can be
set as an environment variable or in `backend/.env`; see `.env.example`.

| Variable          | Default                      |
| ----------------- | ---------------------------- |
| `DATABASE_URL`    | `sqlite:///backend/climber.db` |
| `CORS_ORIGINS`    | `http://localhost:3000` (comma separated) |
| `SEED_ON_STARTUP` | `true`                       |
| `API_V1_PREFIX`   | `/api/v1`                    |

Run the tests with `uv run pytest`. Reset and reseed the database with
`uv run python -m app.db.seed`.

> **Sample data.** Spot coordinates are real. Route names, grades and first
> ascents are given for flavour, but every hold layout is procedurally
> generated (`backend/app/db/seed.py`). It is not real beta.

## Frontend

- **World map** (`src/components/map`): equirectangular projection with
  `d3-geo`, Natural Earth land from `world-atlas`, gridded land fill,
  coastlines traced in on load, graticule rulers, a targeting crosshair with
  live coordinates, a scale bar, pan/zoom with `d3-zoom`, and fly-to on
  selection. The
  selected spot lives in the URL (`/?spot=3`), so the dossier survives
  navigation.
- **Route viewer** (`src/components/wall`, scene in `wall/scene/`): the rock
  is a mesh displaced with seeded fractal noise (`src/lib/wall.ts`) and drawn
  by a custom shader: dark rock with a quiet 1 m survey grid, topographic
  contours, dashed corridor rails, 5 m height bands and an animated survey
  sweep that travels up the wall. Holds are faceted, edge-outlined shapes by
  kind, coloured by role (hand, foot, crux) and rotated to their pull
  direction; they grow with camera distance so they stay visible on long
  routes. Bloom, vignette and film grain come from `@react-three/postprocessing`.
  Selecting a hold (in the scene, the sequence list or the altimeter strip)
  flies the camera there and locks a targeting reticle onto it. The HUD shows
  live camera azimuth, elevation and range, and a toolbar toggles layers.
- **UI kit** (`src/components/ui`): headless
  [Base UI](https://base-ui.com) primitives (Tabs, Switch, Checkbox, Tooltip,
  ScrollArea, Progress, Field, Input) styled with Tailwind in the orange/black
  HUD theme defined in `src/app/globals.css`.

Keyboard on the route page: `←`/`→` step through holds, `S` marks the
selected hold as studied, `Esc` clears the selection. Study progress is kept
in `localStorage` per route.
