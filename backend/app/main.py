from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.v1.router import api_router as api_v1_router
from app.core.config import settings
from app.db import create_db, engine
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db()
    if settings.seed_on_startup:
        with Session(engine) as session:
            seed_database(session)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.project_name, version=settings.version, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
