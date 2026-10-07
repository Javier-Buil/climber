import os
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, func, select

from .db import create_db, engine, get_session
from .models import (
    BetaNote,
    BetaNoteCreate,
    BetaNoteRead,
    Hold,
    Route,
    RouteDetail,
    RouteSummary,
    Spot,
    SpotDetail,
    SpotRef,
    SpotSummary,
)
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db()
    with Session(engine) as session:
        seed_database(session)
    yield


app = FastAPI(title="Climber API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

SessionDep = Annotated[Session, Depends(get_session)]


def _route_summary(route: Route, hold_count: int) -> RouteSummary:
    return RouteSummary(
        id=route.id,
        name=route.name,
        grade=route.grade,
        style=route.style,
        length_m=route.length_m,
        wall_angle_deg=route.wall_angle_deg,
        hold_count=hold_count,
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/spots", response_model=list[SpotSummary])
def list_spots(session: SessionDep) -> list[SpotSummary]:
    rows = session.exec(
        select(Spot, func.count(Route.id))
        .outerjoin(Route, Route.spot_id == Spot.id)
        .group_by(Spot.id)
        .order_by(Spot.name)
    ).all()
    return [SpotSummary(**spot.model_dump(), route_count=count) for spot, count in rows]


@app.get("/api/spots/{spot_id}", response_model=SpotDetail)
def get_spot(spot_id: int, session: SessionDep) -> SpotDetail:
    spot = session.get(Spot, spot_id)
    if spot is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Spot not found")
    rows = session.exec(
        select(Route, func.count(Hold.id))
        .where(Route.spot_id == spot_id)
        .outerjoin(Hold, Hold.route_id == Route.id)
        .group_by(Route.id)
        .order_by(Route.name)
    ).all()
    return SpotDetail(
        **spot.model_dump(),
        routes=[_route_summary(route, count) for route, count in rows],
    )


@app.get("/api/routes/{route_id}", response_model=RouteDetail)
def get_route(route_id: int, session: SessionDep) -> RouteDetail:
    route = session.get(Route, route_id)
    if route is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    return RouteDetail(
        **route.model_dump(exclude={"spot_id"}),
        spot=SpotRef.model_validate(route.spot, from_attributes=True),
        holds=sorted(route.holds, key=lambda h: h.sequence),
        beta_notes=sorted(route.beta_notes, key=lambda n: n.created_at, reverse=True),
    )


@app.post(
    "/api/routes/{route_id}/beta",
    response_model=BetaNoteRead,
    status_code=status.HTTP_201_CREATED,
)
def add_beta_note(route_id: int, payload: BetaNoteCreate, session: SessionDep) -> BetaNote:
    if session.get(Route, route_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Route not found")
    if payload.hold_id is not None:
        hold = session.get(Hold, payload.hold_id)
        if hold is None or hold.route_id != route_id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Hold does not belong to this route")
    note = BetaNote(**payload.model_dump(), route_id=route_id)
    session.add(note)
    session.commit()
    session.refresh(note)
    return note
