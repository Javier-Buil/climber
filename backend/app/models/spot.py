from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .route import Route


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
