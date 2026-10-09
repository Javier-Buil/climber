"""Seed content: real climbing areas plus the text used for generated beta.

Spot coordinates are real. Route names and grades are given for flavour; the
hold layouts built from them in ``seed.py`` are illustrative, not real beta.
"""

from dataclasses import dataclass

from app.models import HoldKind, RouteStyle


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
