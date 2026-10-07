"""Database tables and API response schemas.

Coordinates for holds are expressed in metres on the wall plane: ``x`` runs
left to right from the wall centre line and ``y`` runs upwards from the base.
The frontend projects them onto the 3D wall surface, so the backend never has
to know about the rendered geometry beyond ``wall_angle_deg`` and
``surface_seed``.
"""

from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


class RouteStyle(str, Enum):
    sport = "sport"
    trad = "trad"
    boulder = "boulder"


class HoldKind(str, Enum):
    jug = "jug"
    crimp = "crimp"
    sloper = "sloper"
    pinch = "pinch"
    pocket = "pocket"
    edge = "edge"
    undercling = "undercling"
    sidepull = "sidepull"
    foothold = "foothold"


class HoldUsage(str, Enum):
    hand = "hand"
    foot = "foot"
    both = "both"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --- Tables -----------------------------------------------------------------


class SpotBase(SQLModel):
    slug: str = Field(index=True, unique=True)
    name: str
    country: str
    region: str
    latitude: float
    longitude: float
    rock_type: str
    elevation_m: int
    description: str


class Spot(SpotBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    routes: list["Route"] = Relationship(back_populates="spot")


class RouteBase(SQLModel):
    name: str
    grade: str
    style: RouteStyle
    length_m: float
    wall_angle_deg: float = Field(
        description="Average wall angle from vertical. Positive values overhang."
    )
    wall_width_m: float
    surface_seed: int = Field(description="Seed for the procedural rock surface.")
    first_ascent: str | None = None
    description: str


class Route(RouteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    spot_id: int = Field(foreign_key="spot.id", index=True)
    spot: Spot = Relationship(back_populates="routes")
    holds: list["Hold"] = Relationship(back_populates="route")
    beta_notes: list["BetaNote"] = Relationship(back_populates="route")


class HoldBase(SQLModel):
    sequence: int = Field(description="Order in which the hold is used on the line.")
    x: float
    y: float
    kind: HoldKind
    usage: HoldUsage
    size_cm: float
    pull_direction_deg: float = Field(
        description="Direction of the force on the hold, 0 = pull straight down."
    )
    is_crux: bool = False
    note: str | None = None


class Hold(HoldBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    route_id: int = Field(foreign_key="route.id", index=True)
    route: Route = Relationship(back_populates="holds")


class BetaNoteBase(SQLModel):
    author: str = Field(min_length=1, max_length=60)
    body: str = Field(min_length=1, max_length=1000)
    hold_id: int | None = Field(default=None, foreign_key="hold.id")


class BetaNote(BetaNoteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    route_id: int = Field(foreign_key="route.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    route: Route = Relationship(back_populates="beta_notes")


# --- API schemas ------------------------------------------------------------


class SpotSummary(SpotBase):
    id: int
    route_count: int


class RouteSummary(SQLModel):
    id: int
    name: str
    grade: str
    style: RouteStyle
    length_m: float
    wall_angle_deg: float
    hold_count: int


class SpotDetail(SpotBase):
    id: int
    routes: list[RouteSummary]


class HoldRead(HoldBase):
    id: int


class BetaNoteCreate(BetaNoteBase):
    pass


class BetaNoteRead(BetaNoteBase):
    id: int
    created_at: datetime


class SpotRef(SQLModel):
    id: int
    slug: str
    name: str
    country: str
    latitude: float
    longitude: float


class RouteDetail(RouteBase):
    id: int
    spot: SpotRef
    holds: list[HoldRead]
    beta_notes: list[BetaNoteRead]
