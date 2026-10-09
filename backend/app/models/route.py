from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .enums import RouteStyle

if TYPE_CHECKING:
    from .beta_note import BetaNote
    from .hold import Hold
    from .spot import Spot


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
    spot: "Spot" = Relationship(back_populates="routes")
    holds: list["Hold"] = Relationship(back_populates="route")
    beta_notes: list["BetaNote"] = Relationship(back_populates="route")
