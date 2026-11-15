from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import init_db, close_db
from backend.app.api.routes import router as api_router
from backend.app.api.mcp import router as mcp_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Vector Observatory 144",
    description="Token compression observatory for coding agents implementing caveman-style compression",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix="/api/v1")

# Include MCP proxy router
app.include_router(mcp_router, prefix="/mcp", tags=["mcp-proxy"])


@app.get("/")
async def root():
    return {
        "name": "Vector Observatory 144",
        "version": "1.0.0",
        "description": "Token compression observatory for coding agents",
        "docs": "/docs",
    }
