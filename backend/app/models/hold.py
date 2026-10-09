"""Holds are positioned in metres on the wall plane.

``x`` runs left to right from the wall centre line and ``y`` runs upwards
along the wall from its base. The frontend projects them onto the 3D surface,
so the backend only needs ``wall_angle_deg`` and ``surface_seed`` on the route.
"""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .enums import HoldKind, HoldUsage

if TYPE_CHECKING:
    from .route import Route


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
    route: "Route" = Relationship(back_populates="holds")
