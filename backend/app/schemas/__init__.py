"""Request and response bodies exposed by the API."""

from .beta_note import BetaNoteCreate, BetaNoteRead
from .hold import HoldRead
from .route import RouteDetail, RouteSummary, SpotRef
from .spot import SpotDetail, SpotSummary

__all__ = [
    "BetaNoteCreate",
    "BetaNoteRead",
    "HoldRead",
    "RouteDetail",
    "RouteSummary",
    "SpotDetail",
    "SpotRef",
    "SpotSummary",
]
