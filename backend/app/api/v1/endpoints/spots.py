from fastapi import APIRouter, HTTPException, status

from app.api.deps import SessionDep
from app.schemas import SpotDetail, SpotSummary
from app.services import spots as spot_service

router = APIRouter(prefix="/spots", tags=["spots"])


@router.get("", response_model=list[SpotSummary])
def list_spots(session: SessionDep) -> list[SpotSummary]:
    return spot_service.list_spots(session)


@router.get("/{spot_id}", response_model=SpotDetail)
def get_spot(spot_id: int, session: SessionDep) -> SpotDetail:
    spot = spot_service.get_spot(session, spot_id)
    if spot is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Spot not found")
    return spot
