from app.models import SpotBase

from .route import RouteSummary


class SpotSummary(SpotBase):
    id: int
    route_count: int


class SpotDetail(SpotBase):
    id: int
    routes: list[RouteSummary]
