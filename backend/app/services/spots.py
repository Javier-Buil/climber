from sqlmodel import Session, func, select

from app.models import Hold, Route, Spot
from app.schemas import RouteSummary, SpotDetail, SpotSummary


def list_spots(session: Session) -> list[SpotSummary]:
    rows = session.exec(
        select(Spot, func.count(Route.id))
        .outerjoin(Route, Route.spot_id == Spot.id)
        .group_by(Spot.id)
        .order_by(Spot.name)
    ).all()
    return [SpotSummary(**spot.model_dump(), route_count=count) for spot, count in rows]


def get_spot(session: Session, spot_id: int) -> SpotDetail | None:
    spot = session.get(Spot, spot_id)
    if spot is None:
        return None
    rows = session.exec(
        select(Route, func.count(Hold.id))
        .where(Route.spot_id == spot_id)
        .outerjoin(Hold, Hold.route_id == Route.id)
        .group_by(Route.id)
        .order_by(Route.name)
    ).all()
    return SpotDetail(
        **spot.model_dump(),
        routes=[
            RouteSummary(**route.model_dump(include=set(RouteSummary.model_fields)), hold_count=count)
            for route, count in rows
        ],
    )
