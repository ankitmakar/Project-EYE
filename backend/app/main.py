import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import EyeException
from app.core.logging import logger, setup_logging
from app.core.middleware import RequestContextMiddleware, SecurityHeadersMiddleware
from app.db.session import init_db
from app.detection.rule_loader import RuleLoader

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Setup Logging
    setup_logging()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # 2. Initialize Database Tables
    await init_db()

    # 3. Load Built-in Detection Rules
    backend_rules_path = Path(__file__).parent / "detection" / "rules"
    detection_rules_path = Path(__file__).parents[2] / "detection-rules"
    
    RuleLoader.load_rules_from_dir(str(backend_rules_path))
    if detection_rules_path.exists():
        RuleLoader.load_rules_from_dir(str(detection_rules_path))

    yield

    logger.info("Shutting down Project EYE backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Attach Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Fail-Secure Exception Handlers
@app.exception_handler(EyeException)
async def eye_exception_handler(request: Request, exc: EyeException):
    request_id = getattr(request.state, "request_id", "N/A")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "request_id": request_id
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "N/A")
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path} [request_id={request_id}]: {exc}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please contact SOC administration.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id
        }
    )

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "active_rules_count": len(RuleLoader.get_all_rules())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
