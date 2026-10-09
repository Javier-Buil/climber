from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .route import Route


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BetaNoteBase(SQLModel):
    author: str = Field(min_length=1, max_length=60)
    body: str = Field(min_length=1, max_length=1000)
    hold_id: int | None = Field(default=None, foreign_key="hold.id")


class BetaNote(BetaNoteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    route_id: int = Field(foreign_key="route.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    route: "Route" = Relationship(back_populates="beta_notes")
