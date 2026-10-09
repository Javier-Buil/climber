from sqlmodel import SQLModel

from app.models import RouteBase, RouteStyle

from .beta_note import BetaNoteRead
from .hold import HoldRead


class RouteSummary(SQLModel):
    id: int
    name: str
    grade: str
    style: RouteStyle
    length_m: float
    wall_angle_deg: float
    hold_count: int


class SpotRef(SQLModel):
    """The spot a route belongs to, embedded in the route detail."""

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
