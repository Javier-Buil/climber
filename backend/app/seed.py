"""Sample data: real climbing areas with procedurally generated hold maps.

Spot coordinates are real. Route lines and their hold layouts are generated
deterministically from a seed so the 3D viewer has something to show; they are
illustrative and must not be used as real beta.
"""

import random
from dataclasses import dataclass

from sqlmodel import Session, select

from .models import BetaNote, Hold, HoldKind, HoldUsage, Route, RouteStyle, Spot


@dataclass(frozen=True)
class RouteSeed:
    name: str
    grade: str
    style: RouteStyle
    length_m: float
    wall_angle_deg: float
    difficulty: float  # 0 (easy) .. 1 (world class); drives hold size and spacing
    description: str
    first_ascent: str | None = None


SPOTS: list[dict] = [
    {
        "slug": "siurana",
        "name": "Siurana",
        "country": "Spain",
        "region": "Catalonia",
        "latitude": 41.2575,
        "longitude": 0.9330,
        "rock_type": "Limestone",
        "elevation_m": 737,
        "description": "Orange and grey limestone walls ringing a hilltop village above the Priorat.",
        "routes": [
            RouteSeed("La Rambla", "9a+", RouteStyle.sport, 41, 12, 0.95,
                      "Long, sustained endurance line finishing on a desperate extension.",
                      "Ramón Julián, 2003"),
            RouteSeed("El Pati Amagat", "7a", RouteStyle.sport, 25, 4, 0.45,
                      "Technical vertical face with a bouldery bulge at two thirds height."),
            RouteSeed("Grimpada Roja", "6b+", RouteStyle.sport, 22, -6, 0.3,
                      "Delicate slab on perfect grey rock. Trust your feet."),
        ],
    },
    {
        "slug": "ceuse",
        "name": "Céüse",
        "country": "France",
        "region": "Hautes-Alpes",
        "latitude": 44.5050,
        "longitude": 5.9440,
        "rock_type": "Limestone",
        "elevation_m": 1900,
        "description": "A kilometre-long band of blue-streaked limestone with pockets to die for.",
        "routes": [
            RouteSeed("Biographie", "9a+", RouteStyle.sport, 35, 8, 0.95,
                      "Pocket climbing on a gently overhanging blue wall, crux high up.",
                      "Chris Sharma, 2001"),
            RouteSeed("Dalle Bleue", "6b", RouteStyle.sport, 30, -8, 0.28,
                      "Classic pocketed slab, long reaches between rests."),
        ],
    },
    {
        "slug": "flatanger",
        "name": "Flatanger",
        "country": "Norway",
        "region": "Trøndelag",
        "latitude": 64.4950,
        "longitude": 10.8000,
        "rock_type": "Granite",
        "elevation_m": 50,
        "description": "The Hanshelleren cave: a huge granite amphitheatre of steep cracks and roofs.",
        "routes": [
            RouteSeed("Silence", "9c", RouteStyle.sport, 45, 48, 1.0,
                      "Steep cave climbing with knee bars and a brutal boulder crux in the roof.",
                      "Adam Ondra, 2017"),
            RouteSeed("Change", "9b+", RouteStyle.sport, 55, 42, 0.98,
                      "Massive overhang with a long sequence of compression moves.",
                      "Adam Ondra, 2012"),
        ],
    },
    {
        "slug": "frankenjura",
        "name": "Frankenjura",
        "country": "Germany",
        "region": "Bavaria",
        "latitude": 49.7300,
        "longitude": 11.3300,
        "rock_type": "Dolomitic limestone",
        "elevation_m": 450,
        "description": "Short, powerful routes on forested crags. Birthplace of the redpoint.",
        "routes": [
            RouteSeed("Action Directe", "9a", RouteStyle.sport, 16, 45, 0.92,
                      "Mono and two finger pockets on a steep wall. Dynamic from start to finish.",
                      "Wolfgang Güllich, 1991"),
            RouteSeed("Wallstreet", "8c", RouteStyle.sport, 15, 10, 0.85,
                      "Fingery vertical climbing on tiny edges.",
                      "Wolfgang Güllich, 1987"),
        ],
    },
    {
        "slug": "yosemite",
        "name": "Yosemite Valley",
        "country": "United States",
        "region": "California",
        "latitude": 37.7340,
        "longitude": -119.6377,
        "rock_type": "Granite",
        "elevation_m": 1200,
        "description": "Big walls, splitter cracks and legendary boulders on the valley floor.",
        "routes": [
            RouteSeed("Midnight Lightning", "V8", RouteStyle.boulder, 5, 6, 0.7,
                      "The lightning bolt boulder at Camp 4. Committing mantle top out.",
                      "Ron Kauk, 1978"),
            RouteSeed("Granite Ghost", "5.10b", RouteStyle.trad, 30, 0, 0.35,
                      "Finger crack to a blocky ledge, protects well with small cams."),
        ],
    },
    {
        "slug": "red-river-gorge",
        "name": "Red River Gorge",
        "country": "United States",
        "region": "Kentucky",
        "latitude": 37.7800,
        "longitude": -83.6800,
        "rock_type": "Sandstone",
        "elevation_m": 300,
        "description": "Steep, pocketed sandstone with endless jugs hidden in the forest.",
        "routes": [
            RouteSeed("Golden Ticket", "5.14c", RouteStyle.sport, 25, 30, 0.9,
                      "Overhanging power endurance on iron-hard huecos."),
            RouteSeed("Hueco Highway", "5.11b", RouteStyle.sport, 20, 20, 0.5,
                      "Jug haul on a steep prow, pumpy but never desperate."),
        ],
    },
    {
        "slug": "kalymnos",
        "name": "Kalymnos",
        "country": "Greece",
        "region": "Dodecanese",
        "latitude": 36.9900,
        "longitude": 26.9600,
        "rock_type": "Limestone",
        "elevation_m": 150,
        "description": "Tufas, stalactites and caves above the Aegean Sea.",
        "routes": [
            RouteSeed("Aegean Tufa", "7c", RouteStyle.sport, 30, 25, 0.65,
                      "Pinch the tufa system up a steep grotto, kneebar rest at mid height."),
            RouteSeed("Blue Hour", "6c", RouteStyle.sport, 28, 10, 0.4,
                      "Sunset classic on grey slightly overhanging rock."),
        ],
    },
    {
        "slug": "railay",
        "name": "Railay",
        "country": "Thailand",
        "region": "Krabi",
        "latitude": 8.0110,
        "longitude": 98.8370,
        "rock_type": "Limestone",
        "elevation_m": 10,
        "description": "Beach-side karst towers with stalactites and deep water soloing.",
        "routes": [
            RouteSeed("Monsoon Drip", "6b+", RouteStyle.sport, 18, 15, 0.35,
                      "Stalactite climbing straight off the sand."),
        ],
    },
    {
        "slug": "rocklands",
        "name": "Rocklands",
        "country": "South Africa",
        "region": "Western Cape",
        "latitude": -32.2000,
        "longitude": 19.0500,
        "rock_type": "Sandstone",
        "elevation_m": 900,
        "description": "Bouldering on featured orange sandstone in the Cederberg mountains.",
        "routes": [
            RouteSeed("Desert Moon", "7C", RouteStyle.boulder, 4.5, 35, 0.75,
                      "Steep start on slopers into a big move to the lip."),
            RouteSeed("Ochre Prow", "6C", RouteStyle.boulder, 4, 20, 0.5,
                      "Compression up a rounded prow."),
        ],
    },
    {
        "slug": "grampians",
        "name": "Grampians",
        "country": "Australia",
        "region": "Victoria",
        "latitude": -37.1500,
        "longitude": 142.4500,
        "rock_type": "Sandstone",
        "elevation_m": 400,
        "description": "Bullet-hard orange sandstone in Gariwerd national park.",
        "routes": [
            RouteSeed("Taipan Edge", "26", RouteStyle.sport, 30, 12, 0.6,
                      "Flake lines and horizontal breaks on a sweeping orange wall."),
        ],
    },
    {
        "slug": "squamish",
        "name": "Squamish",
        "country": "Canada",
        "region": "British Columbia",
        "latitude": 49.6800,
        "longitude": -123.1400,
        "rock_type": "Granite",
        "elevation_m": 50,
        "description": "The Stawamus Chief and forest boulders between sea and mountains.",
        "routes": [
            RouteSeed("Chief's Dihedral", "5.10c", RouteStyle.trad, 35, -3, 0.38,
                      "Stemming corner with a finger crack in the back."),
        ],
    },
    {
        "slug": "potrero-chico",
        "name": "El Potrero Chico",
        "country": "Mexico",
        "region": "Nuevo León",
        "latitude": 25.9500,
        "longitude": -100.4800,
        "rock_type": "Limestone",
        "elevation_m": 800,
        "description": "Towering limestone fins with long multi-pitch sport routes.",
        "routes": [
            RouteSeed("Cañón Naranja", "5.12a", RouteStyle.sport, 30, 5, 0.55,
                      "Sharp edges on a vertical orange shield."),
        ],
    },
    {
        "slug": "fontainebleau",
        "name": "Fontainebleau",
        "country": "France",
        "region": "Île-de-France",
        "latitude": 48.4000,
        "longitude": 2.7000,
        "rock_type": "Sandstone",
        "elevation_m": 100,
        "description": "Thousands of sandstone boulders scattered through the forest.",
        "routes": [
            RouteSeed("La Marie-Rose", "6a", RouteStyle.boulder, 4, 0, 0.35,
                      "Historic polished classic at Bas Cuvier.",
                      "Michel Libert, 1946"),
            RouteSeed("Arête du Sablier", "7A", RouteStyle.boulder, 4, 10, 0.6,
                      "Slap up a sharp arête, heel hook on the right."),
        ],
    },
    {
        "slug": "hampi",
        "name": "Hampi",
        "country": "India",
        "region": "Karnataka",
        "latitude": 15.3350,
        "longitude": 76.4600,
        "rock_type": "Granite",
        "elevation_m": 470,
        "description": "Boulder fields among temple ruins and rice paddies.",
        "routes": [
            RouteSeed("Temple Roof", "7A", RouteStyle.boulder, 4.5, 30, 0.6,
                      "Rounded granite roof, all about body tension."),
        ],
    },
    {
        "slug": "wadi-rum",
        "name": "Wadi Rum",
        "country": "Jordan",
        "region": "Aqaba",
        "latitude": 29.5700,
        "longitude": 35.4200,
        "rock_type": "Sandstone",
        "elevation_m": 950,
        "description": "Desert towers of soft red sandstone and adventurous trad lines.",
        "routes": [
            RouteSeed("Red Desert Crack", "6c", RouteStyle.trad, 30, 0, 0.42,
                      "Hand crack splitting a red tower."),
        ],
    },
    {
        "slug": "frey",
        "name": "Refugio Frey",
        "country": "Argentina",
        "region": "Río Negro",
        "latitude": -41.1700,
        "longitude": -71.4500,
        "rock_type": "Granite",
        "elevation_m": 1700,
        "description": "Alpine granite spires above a lake near Bariloche.",
        "routes": [
            RouteSeed("Aguja Dihedral", "6b", RouteStyle.trad, 35, -2, 0.33,
                      "Clean corner system to a spectacular summit block."),
        ],
    },
]

HAND_NOTES = [
    "Thumb catch on the left side makes this much better.",
    "Drop knee on the right foot to reach the next hold.",
    "Good shake out here. Chalk up both hands.",
    "Heel hook available just right of this hold.",
    "Polished. Squeeze it and keep the hips close.",
    "Match here, then cross through.",
    "Clip from this hold, not the next one.",
    "Hold is better than it looks from the ground.",
]
CRUX_NOTES = [
    "Crux: commit to the deadpoint, the next hold is positive.",
    "Crux: keep tension, feet cut easily here.",
    "Crux: bump the left hand once before moving the right.",
]
FOOT_NOTES = [
    "Smear high on the bulge, there is no real foothold.",
    "Small edge, use the inside of the shoe.",
    "Toe hook possible to stop the swing.",
]
CRUX_BETA = [
    "Fell here on every attempt until I moved my left foot up first.",
    "This is where the crux starts. Don't over-grip the hold before it.",
    "Short people: there is an intermediate crimp just left of this one.",
]
HAND_BETA = [
    "Last good rest before the hard section. Take your time.",
    "Clip from here, reaching higher costs too much.",
    "Felt greasy in the afternoon, much better in the morning shade.",
]
AUTHORS = ["kestrel", "m.ortega", "lina_k", "dune_runner", "ana.v", "tomasz", "sendtrain"]
ROUTE_NOTES = [
    "Warm up well, the first moves are colder than they look.",
    "Brush the holds before trying, chalk builds up fast.",
    "Best conditions in the shade, friction is gone in direct sun.",
    "The rest before the crux is the key. Stay longer than you think.",
    "Bring a stick clip for the first bolt.",
]

HARD_HAND_KINDS = [HoldKind.crimp, HoldKind.pocket, HoldKind.sloper, HoldKind.pinch, HoldKind.sidepull]
EASY_HAND_KINDS = [HoldKind.jug, HoldKind.edge, HoldKind.pinch, HoldKind.undercling, HoldKind.sidepull]
SIZE_RANGE_CM = {
    HoldKind.jug: (12, 22),
    HoldKind.edge: (3, 6),
    HoldKind.crimp: (1, 2.5),
    HoldKind.sloper: (12, 25),
    HoldKind.pinch: (5, 12),
    HoldKind.pocket: (1.5, 4),
    HoldKind.undercling: (4, 10),
    HoldKind.sidepull: (3, 8),
    HoldKind.foothold: (1, 5),
}


def wall_width(route: RouteSeed) -> float:
    return 4.0 if route.style == RouteStyle.boulder else 6.0


def _pull_direction(kind: HoldKind, rng: random.Random) -> float:
    if kind == HoldKind.undercling:
        return 180 + rng.uniform(-20, 20)
    if kind == HoldKind.sidepull:
        return rng.choice([-90, 90]) + rng.uniform(-15, 15)
    return rng.uniform(-30, 30)


def _hand_kind(difficulty: float, rng: random.Random) -> HoldKind:
    pool = HARD_HAND_KINDS if rng.random() < difficulty else EASY_HAND_KINDS
    return rng.choice(pool)


def _size(kind: HoldKind, difficulty: float, rng: random.Random) -> float:
    low, high = SIZE_RANGE_CM[kind]
    # Harder routes skew towards the small end of each range.
    t = rng.random() * (1 - 0.6 * difficulty)
    return round(low + (high - low) * t, 1)


def generate_holds(route: RouteSeed, seed: int) -> list[Hold]:
    """Lay out a plausible line of hand and foot holds up the wall."""
    rng = random.Random(seed)
    half_width = wall_width(route) / 2 - 0.4
    top = route.length_m - 0.3
    step = (0.45 if route.style == RouteStyle.boulder else 0.6) + 0.35 * route.difficulty
    crux_start = top * rng.uniform(0.55, 0.75)
    crux_end = crux_start + max(1.0, top * 0.1)

    holds: list[Hold] = []
    seq = 0

    def add(**kwargs) -> Hold:
        nonlocal seq
        seq += 1
        hold = Hold(sequence=seq, **kwargs)
        holds.append(hold)
        return hold

    # Start: two feet, then two matched-ish hands.
    for side in (-1, 1):
        add(x=round(side * 0.35, 2), y=0.35, kind=HoldKind.foothold, usage=HoldUsage.foot,
            size_cm=_size(HoldKind.foothold, route.difficulty, rng), pull_direction_deg=0)
    for side in (-1, 1):
        kind = _hand_kind(route.difficulty * 0.6, rng)
        add(x=round(side * 0.3, 2), y=1.5, kind=kind, usage=HoldUsage.hand,
            size_cm=_size(kind, route.difficulty, rng),
            pull_direction_deg=round(_pull_direction(kind, rng), 1),
            note="Start: both hands here." if side == 1 else None)

    x = 0.0
    y = 1.5
    side = 1
    while y + step * 0.5 < top:
        y = min(top, y + step * rng.uniform(0.75, 1.25))
        x = max(-half_width, min(half_width, x + rng.uniform(-0.6, 0.6)))
        hand_x = max(-half_width, min(half_width, x + side * rng.uniform(0.15, 0.4)))
        in_crux = crux_start <= y <= crux_end

        foot_kind = HoldKind.foothold if rng.random() < 0.75 else HoldKind.edge
        add(x=round(hand_x - side * rng.uniform(0.1, 0.5), 2),
            y=round(max(0.2, y - rng.uniform(1.0, 1.4)), 2),
            kind=foot_kind, usage=HoldUsage.foot,
            size_cm=_size(foot_kind, route.difficulty, rng), pull_direction_deg=0,
            note=rng.choice(FOOT_NOTES) if rng.random() < 0.08 else None)

        kind = _hand_kind(min(1.0, route.difficulty + (0.3 if in_crux else 0)), rng)
        size = _size(kind, route.difficulty, rng)
        if in_crux:
            size = round(max(SIZE_RANGE_CM[kind][0], size * 0.7), 1)
            note = rng.choice(CRUX_NOTES) if rng.random() < 0.6 else None
        else:
            note = rng.choice(HAND_NOTES) if rng.random() < 0.18 else None
        add(x=round(hand_x, 2), y=round(y, 2), kind=kind,
            usage=HoldUsage.both if kind == HoldKind.jug and rng.random() < 0.3 else HoldUsage.hand,
            size_cm=size, pull_direction_deg=round(_pull_direction(kind, rng), 1),
            is_crux=in_crux, note=note)
        side = -side

    finish = "Top out: mantle and walk off." if route.style == RouteStyle.boulder else "Finish jug. Clip the chains."
    add(x=round(x, 2), y=round(top, 2), kind=HoldKind.jug, usage=HoldUsage.hand,
        size_cm=_size(HoldKind.jug, 0, rng), pull_direction_deg=0, note=finish)
    return holds


def generate_beta_notes(route: Route, rng: random.Random) -> list[BetaNote]:
    notes = [BetaNote(author=rng.choice(AUTHORS), body=rng.choice(ROUTE_NOTES))]
    holds = sorted(route.holds, key=lambda h: h.sequence)
    crux = [h for h in holds if h.is_crux and h.usage != HoldUsage.foot]
    if crux:
        notes.append(BetaNote(author=rng.choice(AUTHORS), hold_id=crux[0].id, body=rng.choice(CRUX_BETA)))
    hands = [h for h in holds[4:-1] if h.usage != HoldUsage.foot and not h.is_crux]
    if hands:
        notes.append(BetaNote(author=rng.choice(AUTHORS), hold_id=rng.choice(hands).id, body=rng.choice(HAND_BETA)))
    return notes


def seed_database(session: Session) -> bool:
    """Populate an empty database. Returns True if data was inserted."""
    if session.exec(select(Spot)).first() is not None:
        return False

    surface_seed = 1000
    for spot_data in SPOTS:
        spot = Spot(**{k: v for k, v in spot_data.items() if k != "routes"})
        session.add(spot)
        for route_seed in spot_data["routes"]:
            surface_seed += 7
            route = Route(
                spot=spot,
                name=route_seed.name,
                grade=route_seed.grade,
                style=route_seed.style,
                length_m=route_seed.length_m,
                wall_angle_deg=route_seed.wall_angle_deg,
                wall_width_m=wall_width(route_seed),
                surface_seed=surface_seed,
                first_ascent=route_seed.first_ascent,
                description=route_seed.description,
            )
            route.holds = generate_holds(route_seed, surface_seed)
            session.add(route)
    session.commit()

    # Beta notes reference hold ids, so they are added once holds are persisted.
    rng = random.Random(42)
    for route in session.exec(select(Route)).all():
        for note in generate_beta_notes(route, rng):
            note.route_id = route.id
            session.add(note)
    session.commit()
    return True
