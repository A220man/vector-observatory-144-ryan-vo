from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models import (
    CompressionRecord,
    SessionRecord,
    CompressionPolicy,
    AuditLog,
    CompressionMode,
    CompressionProfile,
    AgentFramework,
    SessionType,
)
from app.services.compression import get_compressor, CompressionResult

router = APIRouter()


# Pydantic models for API
class CompressionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    session_id: Optional[str] = None
    agent_framework: AgentFramework = AgentFramework.OTHER
    session_type: SessionType = SessionType.UNKNOWN
    mode: CompressionMode = CompressionMode.COMPRESS
    profile: CompressionProfile = CompressionProfile.FULL_SAFE


class CompressionResponse(BaseModel):
    session_id: str
    request_id: str
    original_text: str
    compressed_text: str
    tokens_before: int
    tokens_after: int
    tokens_saved: int
    compression_ratio: float
    recovery_ref: str
    mode: CompressionMode
    profile: CompressionProfile


class SessionCreate(BaseModel):
    agent_framework: AgentFramework = AgentFramework.OTHER
    session_type: SessionType = SessionType.UNKNOWN
    mode: CompressionMode = CompressionMode.COMPRESS
    profile: CompressionProfile = CompressionProfile.FULL_SAFE


class SessionResponse(BaseModel):
    session_id: str
    agent_framework: AgentFramework
    session_type: SessionType
    mode: CompressionMode
    profile: CompressionProfile
    total_requests: int
    eligible_requests: int
    total_tokens_before: int
    total_tokens_after: int
    total_tokens_saved: int
    mcp_connected: bool
    recovery_via_mcp: bool
    started_at: datetime
    ended_at: Optional[datetime]
    last_activity_at: Optional[datetime]


class SessionStats(BaseModel):
    total_sessions: int
    total_requests: int
    total_tokens_before: int
    total_tokens_after: int
    total_tokens_saved: int
    average_compression_ratio: float
    by_framework: dict
    by_mode: dict
    by_session_type: dict


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = None
    mode: CompressionMode = CompressionMode.COMPRESS
    profile: CompressionProfile = CompressionProfile.FULL_SAFE
    target_frameworks: Optional[List[AgentFramework]] = None
    min_tokens_threshold: int = Field(default=100, ge=0)
    max_output_tokens: int = Field(default=8192, ge=100)
    enabled: bool = True
    is_default: bool = False


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    mode: CompressionMode
    profile: CompressionProfile
    target_frameworks: Optional[str]
    min_tokens_threshold: int
    max_output_tokens: int
    enabled: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc),
    )


@router.post("/compress", response_model=CompressionResponse)
async def compress_text(request: CompressionRequest, db: AsyncSession = Depends(get_db)):
    session_id = request.session_id or str(uuid.uuid4())[:12]
    request_id = str(uuid.uuid4())[:12]

    compressor = get_compressor(mode=request.mode, profile=request.profile)
    result: CompressionResult = compressor.compress(request.text, session_id, request_id)

    # Create or get session
    session = await db.execute(select(SessionRecord).where(SessionRecord.session_id == session_id))
    session_rec = session.scalar_one_or_none()

    if not session_rec:
        session_rec = SessionRecord(
            session_id=session_id,
            agent_framework=request.agent_framework,
            session_type=request.session_type,
            mode=request.mode,
            profile=request.profile,
        )
        db.add(session_rec)

    # Update session stats
    session_rec.total_requests += 1
    session_rec.total_tokens_before += result.tokens_before
    session_rec.total_tokens_after += result.tokens_after
    session_rec.total_tokens_saved += result.tokens_saved
    session_rec.last_activity_at = datetime.now(timezone.utc)

    if result.tokens_saved > 0:
        session_rec.eligible_requests += 1

    # Record compression
    record = CompressionRecord(
        session_id=session_id,
        request_id=request_id,
        agent_framework=request.agent_framework,
        session_type=request.session_type,
        mode=request.mode,
        profile=request.profile,
        tokens_before=result.tokens_before,
        tokens_after=result.tokens_after,
        tokens_saved=result.tokens_saved,
        compression_ratio=result.compression_ratio,
        input_text_hash=hashlib.sha256(request.text.encode()).hexdigest()[:16],
        output_text_hash=hashlib.sha256(result.compressed_text.encode()).hexdigest()[:16],
        recovery_ref=result.recovery_ref,
    )
    db.add(record)

    # Audit log
    audit = AuditLog(
        event_type="compression",
        entity_type="compression_record",
        entity_id=request_id,
        session_id=session_id,
        details=f'{{"tokens_before": {result.tokens_before}, "tokens_after": {result.tokens_after}, "tokens_saved": {result.tokens_saved}}}',
    )
    db.add(audit)

    await db.commit()

    return CompressionResponse(
        session_id=session_id,
        request_id=request_id,
        original_text=result.original_text,
        compressed_text=result.compressed_text,
        tokens_before=result.tokens_before,
        tokens_after=result.tokens_after,
        tokens_saved=result.tokens_saved,
        compression_ratio=result.compression_ratio,
        recovery_ref=result.recovery_ref,
        mode=request.mode,
        profile=request.profile,
    )


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: SessionCreate, db: AsyncSession = Depends(get_db)):
    session_id = str(uuid.uuid4())[:12]
    session_rec = SessionRecord(
        session_id=session_id,
        agent_framework=request.agent_framework,
        session_type=request.session_type,
        mode=request.mode,
        profile=request.profile,
    )
    db.add(session_rec)
    await db.commit()
    await db.refresh(session_rec)

    return SessionResponse(
        session_id=session_rec.session_id,
        agent_framework=session_rec.agent_framework,
        session_type=session_rec.session_type,
        mode=session_rec.mode,
        profile=session_rec.profile,
        total_requests=session_rec.total_requests,
        eligible_requests=session_rec.eligible_requests,
        total_tokens_before=session_rec.total_tokens_before,
        total_tokens_after=session_rec.total_tokens_after,
        total_tokens_saved=session_rec.total_tokens_saved,
        mcp_connected=session_rec.mcp_connected,
        recovery_via_mcp=session_rec.recovery_via_mcp,
        started_at=session_rec.started_at,
        ended_at=session_rec.ended_at,
        last_activity_at=session_rec.last_activity_at,
    )


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    limit: int = 50,
    offset: int = 0,
    agent_framework: Optional[AgentFramework] = None,
    session_type: Optional[SessionType] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(SessionRecord).order_by(desc(SessionRecord.started_at))

    if agent_framework:
        query = query.where(SessionRecord.agent_framework == agent_framework)
    if session_type:
        query = query.where(SessionRecord.session_type == session_type)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        SessionResponse(
            session_id=s.session_id,
            agent_framework=s.agent_framework,
            session_type=s.session_type,
            mode=s.mode,
            profile=s.profile,
            total_requests=s.total_requests,
            eligible_requests=s.eligible_requests,
            total_tokens_before=s.total_tokens_before,
            total_tokens_after=s.total_tokens_after,
            total_tokens_saved=s.total_tokens_saved,
            mcp_connected=s.mcp_connected,
            recovery_via_mcp=s.recovery_via_mcp,
            started_at=s.started_at,
            ended_at=s.ended_at,
            last_activity_at=s.last_activity_at,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionRecord).where(SessionRecord.session_id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        session_id=session.session_id,
        agent_framework=session.agent_framework,
        session_type=session.session_type,
        mode=session.mode,
        profile=session.profile,
        total_requests=session.total_requests,
        eligible_requests=session.eligible_requests,
        total_tokens_before=session.total_tokens_before,
        total_tokens_after=session.total_tokens_after,
        total_tokens_saved=session.total_tokens_saved,
        mcp_connected=session.mcp_connected,
        recovery_via_mcp=session.recovery_via_mcp,
        started_at=session.started_at,
        ended_at=session.ended_at,
        last_activity_at=session.last_activity_at,
    )


@router.get("/sessions/{session_id}/records", response_model=List[CompressionResponse])
async def get_session_records(
    session_id: str,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompressionRecord)
        .where(CompressionRecord.session_id == session_id)
        .order_by(desc(CompressionRecord.created_at))
        .limit(limit)
        .offset(offset)
    )
    records = result.scalars().all()

    return [
        CompressionResponse(
            session_id=r.session_id,
            request_id=r.request_id,
            original_text=r.input_text_hash or "",  # Don't return full text in list
            compressed_text=r.output_text_hash or "",
            tokens_before=r.tokens_before,
            tokens_after=r.tokens_after,
            tokens_saved=r.tokens_saved,
            compression_ratio=r.compression_ratio,
            recovery_ref=r.recovery_ref or "",
            mode=r.mode,
            profile=r.profile,
        )
        for r in records
    ]


@router.get("/stats", response_model=SessionStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Total stats
    total_sessions = await db.scalar(select(func.count(SessionRecord.id)))
    total_requests = await db.scalar(select(func.sum(SessionRecord.total_requests)))
    total_before = await db.scalar(select(func.sum(SessionRecord.total_tokens_before)))
    total_after = await db.scalar(select(func.sum(SessionRecord.total_tokens_after)))
    total_saved = await db.scalar(select(func.sum(SessionRecord.total_tokens_saved)))

    # By framework
    framework_result = await db.execute(
        select(SessionRecord.agent_framework, func.count(SessionRecord.id), func.sum(SessionRecord.total_tokens_saved))
        .group_by(SessionRecord.agent_framework)
    )
    by_framework = {str(row[0]): {"sessions": row[1], "tokens_saved": row[2] or 0} for row in framework_result}

    # By mode
    mode_result = await db.execute(
        select(SessionRecord.mode, func.count(SessionRecord.id), func.sum(SessionRecord.total_tokens_saved))
        .group_by(SessionRecord.mode)
    )
    by_mode = {str(row[0]): {"sessions": row[1], "tokens_saved": row[2] or 0} for row in mode_result}

    # By session type
    type_result = await db.execute(
        select(SessionRecord.session_type, func.count(SessionRecord.id), func.sum(SessionRecord.total_tokens_saved))
        .group_by(SessionRecord.session_type)
    )
    by_session_type = {str(row[0]): {"sessions": row[1], "tokens_saved": row[2] or 0} for row in type_result}

    avg_ratio = (total_after / total_before) if total_before and total_before > 0 else 1.0

    return SessionStats(
        total_sessions=total_sessions or 0,
        total_requests=total_requests or 0,
        total_tokens_before=total_before or 0,
        total_tokens_after=total_after or 0,
        total_tokens_saved=total_saved or 0,
        average_compression_ratio=avg_ratio,
        by_framework=by_framework,
        by_mode=by_mode,
        by_session_type=by_session_type,
    )


@router.post("/policies", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(request: PolicyCreate, db: AsyncSession = Depends(get_db)):
    # Check if default already exists
    if request.is_default:
        existing = await db.execute(select(CompressionPolicy).where(CompressionPolicy.is_default == True))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A default policy already exists")

    policy = CompressionPolicy(
        name=request.name,
        description=request.description,
        mode=request.mode,
        profile=request.profile,
        target_frameworks=json.dumps([f.value for f in request.target_frameworks]) if request.target_frameworks else None,
        min_tokens_threshold=request.min_tokens_threshold,
        max_output_tokens=request.max_output_tokens,
        enabled=request.enabled,
        is_default=request.is_default,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)

    return PolicyResponse(
        id=policy.id,
        name=policy.name,
        description=policy.description,
        mode=policy.mode,
        profile=policy.profile,
        target_frameworks=policy.target_frameworks,
        min_tokens_threshold=policy.min_tokens_threshold,
        max_output_tokens=policy.max_output_tokens,
        enabled=policy.enabled,
        is_default=policy.is_default,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.get("/policies", response_model=List[PolicyResponse])
async def list_policies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompressionPolicy).order_by(CompressionPolicy.created_at))
    policies = result.scalars().all()

    return [
        PolicyResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            mode=p.mode,
            profile=p.profile,
            target_frameworks=p.target_frameworks,
            min_tokens_threshold=p.min_tokens_threshold,
            max_output_tokens=p.max_output_tokens,
            enabled=p.enabled,
            is_default=p.is_default,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in policies
    ]


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompressionPolicy).where(CompressionPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    return PolicyResponse(
        id=policy.id,
        name=policy.name,
        description=policy.description,
        mode=policy.mode,
        profile=policy.profile,
        target_frameworks=policy.target_frameworks,
        min_tokens_threshold=policy.min_tokens_threshold,
        max_output_tokens=policy.max_output_tokens,
        enabled=policy.enabled,
        is_default=policy.is_default,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


import hashlib
import json