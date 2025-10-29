"""
API routes initialization
"""
from fastapi import APIRouter
from .health import router as health_router
from .websocket import router as websocket_router

# Main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(health_router, tags=["health"])
api_router.include_router(websocket_router, tags=["websocket"])

__all__ = ["api_router"]
