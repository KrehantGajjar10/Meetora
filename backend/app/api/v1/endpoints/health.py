from fastapi import APIRouter, Query
from typing import Dict, Any

from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter()


@router.get("/health", response_model=Dict[str, Any])
def get_health(check_db: bool = Query(default=False, description="Whether to probe PostgreSQL connection")) -> Dict[str, Any]:
    """Basic API health check endpoint.
    
    By default returns API service status without making unverified database claims.
    If check_db=True is passed, explicitly probes the database and reports its actual state.
    """
    response: Dict[str, Any] = {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

    if check_db:
        is_db_connected = check_db_connection()
        response["database"] = {
            "connected": is_db_connected,
            "status": "healthy" if is_db_connected else "unavailable"
        }

    return response
