from fastapi import APIRouter

from .endpoints import routes, spots

api_router = APIRouter()
api_router.include_router(spots.router)
api_router.include_router(routes.router)
