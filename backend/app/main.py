from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.endpoints import health, auth, events

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Meetora Smart Event & Workshop Management Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include health check endpoints
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
# Root health route alias for container health checks
app.include_router(health.router, prefix="", tags=["Health"])

# Include auth endpoints
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])

# Include events endpoints (both /api/events and /api/v1/events alias)
app.include_router(events.router, prefix=f"{settings.API_V1_STR}/events", tags=["Events"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"], include_in_schema=False)

# Direct alias for /api/registrations/me and /api/v1/registrations/me
from app.api.v1.endpoints.events import get_my_registrations
from app.schemas.registration import RegistrationResponse
app.add_api_route(
    f"{settings.API_V1_STR}/registrations/me",
    get_my_registrations,
    methods=["GET"],
    response_model=list[RegistrationResponse],
    tags=["Registrations"],
)
app.add_api_route(
    "/api/v1/registrations/me",
    get_my_registrations,
    methods=["GET"],
    response_model=list[RegistrationResponse],
    include_in_schema=False,
)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Meetora API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
