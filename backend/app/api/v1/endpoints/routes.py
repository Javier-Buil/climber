from fastapi import APIRouter, HTTPException, status

from app.api.deps import SessionDep
from app.models import BetaNote
from app.schemas import BetaNoteCreate, BetaNoteRead, RouteDetail
from app.services import routes as route_service

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("/{route_id}", response_model=RouteDetail)
def get_route(route_id: int, session: SessionDep) -> RouteDetail:
    route = route_service.get_route(session, route_id)
    if route is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    return route


@router.post("/{route_id}/beta", response_model=BetaNoteRead, status_code=status.HTTP_201_CREATED)
def add_beta_note(route_id: int, payload: BetaNoteCreate, session: SessionDep) -> BetaNote:
    if not route_service.route_exists(session, route_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    try:
        return route_service.add_beta_note(session, route_id, payload)
    except route_service.HoldNotOnRoute as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
