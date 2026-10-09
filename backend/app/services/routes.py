from sqlmodel import Session

from app.models import BetaNote, Hold, Route
from app.schemas import BetaNoteCreate, RouteDetail, SpotRef


class HoldNotOnRoute(ValueError):
    """Raised when a beta note references a hold from another route."""


def get_route(session: Session, route_id: int) -> RouteDetail | None:
    route = session.get(Route, route_id)
    if route is None:
        return None
    return RouteDetail(
        **route.model_dump(exclude={"spot_id"}),
        spot=SpotRef.model_validate(route.spot, from_attributes=True),
        holds=sorted(route.holds, key=lambda h: h.sequence),
        beta_notes=sorted(route.beta_notes, key=lambda n: n.created_at, reverse=True),
    )


def route_exists(session: Session, route_id: int) -> bool:
    return session.get(Route, route_id) is not None


def add_beta_note(session: Session, route_id: int, payload: BetaNoteCreate) -> BetaNote:
    if payload.hold_id is not None:
        hold = session.get(Hold, payload.hold_id)
        if hold is None or hold.route_id != route_id:
            raise HoldNotOnRoute("Hold does not belong to this route")
    note = BetaNote(**payload.model_dump(), route_id=route_id)
    session.add(note)
    session.commit()
    session.refresh(note)
    return note
