from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import uuid

from backend.app.services.compression import get_compressor, CompressionResult, CompressionProfile, CompressionMode
from backend.app.models import AgentFramework

router = APIRouter()


# Pydantic models for API
class CompressionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    profile: CompressionProfile = CompressionProfile.FULL_SAFE


class CompressionResponse(BaseModel):
    session_id: str
    compressed_text: str
    recovery_ref: str
    tokens_before: int
    tokens_after: int
    tokens_saved: int
    compression_ratio: float
    profile: CompressionProfile


class SessionCreate(BaseModel):
    agent_framework: AgentFramework = AgentFramework.OTHER
    text: Optional[str] = None
    profile: CompressionProfile = CompressionProfile.FULL_SAFE


class SessionResponse(BaseModel):
    session_id: str
    agent_framework: AgentFramework
    mode: str = "interactive"
    compression_profile: CompressionProfile = CompressionProfile.FULL_SAFE
    last_activity_at: Optional[datetime] = None


class SessionStats(BaseModel):
    total_sessions: int
    total_compressions: int
    total_tokens_saved: int


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    is_default: bool = False


class PolicyResponse(BaseModel):
    id: int
    name: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", version="1.0.0", timestamp=datetime.utcnow())


@router.post(
    "/compress",
    response_model=CompressionResponse,
    summary="Compress text using caveman vocabulary",
)
async def compress_text(
    request: CompressionRequest,
):
    """Compress text using the caveman-style token compressor."""
    compressor = get_compressor(
        mode=CompressionMode.COMPRESS,
        profile=request.profile,
    )
    session_id = str(uuid.uuid4())[:12]
    request_id = str(uuid.uuid4())[:12]
    result: CompressionResult = compressor.compress(
        request.text, session_id, request_id
    )
    return CompressionResponse(
        session_id=session_id,
        compressed_text=result.compressed_text,
        recovery_ref=result.recovery_ref,
        tokens_before=result.tokens_before,
        tokens_after=result.tokens_after,
        tokens_saved=result.tokens_saved,
        compression_ratio=result.compression_ratio,
        profile=request.profile,
    )
