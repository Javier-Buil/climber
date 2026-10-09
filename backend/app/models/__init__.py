"""Database tables. Importing this package registers every table with SQLModel."""

from .beta_note import BetaNote, BetaNoteBase
from .enums import HoldKind, HoldUsage, RouteStyle
from .hold import Hold, HoldBase
from .route import Route, RouteBase
from .spot import Spot, SpotBase

__all__ = [
    "BetaNote",
    "BetaNoteBase",
    "Hold",
    "HoldBase",
    "HoldKind",
    "HoldUsage",
    "Route",
    "RouteBase",
    "RouteStyle",
    "Spot",
    "SpotBase",
]
