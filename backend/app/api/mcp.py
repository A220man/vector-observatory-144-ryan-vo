"""MCP API routes for agent compression integration.

Provides REST endpoints that complement the MCP proxy server,
exposing compression and session management through the HTTP API.
"""

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from backend.app.services.compression import get_compressor, get_recovery_store, CompressionMode, CompressionProfile
from backend.app.models import SessionRecord, CompressionRecord

from backend.app.services.mcp_proxy import get_mcp_proxy

router = APIRouter(tags=["mcp-proxy"])


class CompressRequest(BaseModel):
    text: str
    profile: str = "full-safe"


class RecoverRequest(BaseModel):
    recovery_ref: str


class ToolRegisterRequest(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]


class ToolUnregisterRequest(BaseModel):
    tool_name: str


class SessionCreateRequest(BaseModel):
    agent_framework: str = "claude-code"
    mode: str = "interactive"
    compression_profile: str = "full-safe"


@router.get("/status", response_model=Dict[str, Any])
async def mcp_status():
    """Get MCP proxy status and statistics."""
    proxy = get_mcp_proxy()
    sessions = proxy.list_sessions()
    tools = proxy.list_tools()
    
    return {
        "server": "vector-observatory-mcp-proxy",
        "version": "1.0.0",
        "running": proxy._running if hasattr(proxy, '_running') else False,
        "sessions": {
            "total": len(sessions),
            "active": len([s for s in sessions if s.mode == "interactive"]),
            "print": len([s for s in sessions if s.mode == "print"]),
        },
        "tools": {
            "registered": len(tools),
            "names": [t.name for t in tools],
        },
        "statistics": {
            "total_compressions": sum(s.compression_count for s in sessions),
            "total_requests": sum(s.request_count for s in sessions),
        },
    }


@router.post("/sessions", response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
async def create_mcp_session(
    request: SessionCreateRequest = Body(...),
):
    """Create a new MCP proxy session."""
    proxy = get_mcp_proxy()
    session = proxy.create_session(
        agent_framework=request.agent_framework,
        mode=request.mode,
        compression_profile=request.compression_profile,
    )
    return {"session_id": session.session_id}


@router.get("/sessions", response_model=List[Dict[str, Any]])
async def list_mcp_sessions():
    """List all active MCP proxy sessions."""
    proxy = get_mcp_proxy()
    sessions = proxy.list_sessions()
    return [s.to_dict() for s in sessions]


@router.get("/sessions/{session_id}", response_model=Dict[str, Any])
async def get_mcp_session(session_id: str):
    """Get a specific MCP proxy session."""
    proxy = get_mcp_proxy()
    session = proxy.get_session(session_id)
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP session not found: {session_id}",
        )
    
    return session.to_dict()


@router.post("/sessions/{session_id}/compress", response_model=Dict[str, Any])
async def mcp_compress(
    session_id: str,
    request: CompressRequest = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """Compress text through the MCP proxy for a specific session."""
    proxy = get_mcp_proxy()
    session = proxy.get_session(session_id)
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP session not found: {session_id}",
        )
    
    compressor = get_compressor(
        mode=CompressionMode.COMPRESS,
        profile=CompressionProfile[request.profile.upper().replace("-", "_")],
    )
    
    session_id = session.session_id; request_id = session.session_id[:8]; result = compressor.compress(request.text, session_id, request_id)
    session.increment_compressions()
    
    # Store compression record in database
    from backend.app.models import CompressionRecord
    import hashlib
    record = CompressionRecord(
        session_id=session_id,
        original_text_hash=hashlib.sha256(request.text.encode()).hexdigest()[:16],
        compressed_text=result.compressed_text[:500] if result.compressed_text else "",
        recovery_ref=result.recovery_ref,
        tokens_before=len(request.text.split()),
        tokens_after=len(result.compressed_text.split()) if result.compressed_text else 0,
        tokens_saved=result.tokens_saved if hasattr(result, 'tokens_saved') else 0,
        compression_profile=CompressionProfile[request.profile.upper().replace("-", "_")],
    )
    
    db.add(record)
    await db.commit()
    
    return {
        "session_id": session_id,
        "compressed": result.compressed_text,
        "recovery_ref": result.recovery_ref,
        "tokens_saved": result.tokens_saved,
        "compression_ratio": result.compression_ratio,
        "profile": request.profile,
        "stored": True,
    }


@router.post("/sessions/{session_id}/recover", response_model=Dict[str, Any])
async def mcp_recover(
    session_id: str,
    request: RecoverRequest = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """Recover original text from compression for a specific session."""
    proxy = get_mcp_proxy()
    session = proxy.get_session(session_id)
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP session not found: {session_id}",
        )
    
    from backend.app.services.compression import get_recovery_store
    
    store = get_recovery_store()
    recovered = store.get(request.recovery_ref)
    
    if recovered is None:
        # Try database lookup
        from backend.app.models import CompressionRecord
        result = await db.execute(
            select(CompressionRecord).where(CompressionRecord.recovery_ref == request.recovery_ref)
        )
        record = result.scalar_one_or_none()
        
        if record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cannot recover: {request.recovery_ref}",
            )
    
    session.update_activity()
    
    return {
        "session_id": session_id,
        "recovered_text": recovered,
        "recovery_ref": request.recovery_ref,
    }


@router.post("/tools/register", response_model=Dict[str, str])
async def register_mcp_tool(
    request: ToolRegisterRequest = Body(...),
):
    """Register an MCP tool in the proxy registry."""
    proxy = get_mcp_proxy()
    from backend.app.services.mcp_proxy import MCPTool
    tool = MCPTool(name=request.name, description=request.description, input_schema=request.input_schema)
    proxy.register_tool(tool)
    return {"status": "registered", "tool_name": request.name}


@router.get("/tools", response_model=List[Dict[str, Any]])
async def list_mcp_tools():
    """List all registered MCP tools."""
    proxy = get_mcp_proxy()
    return [t.to_dict() for t in proxy.list_tools()]


@router.delete("/tools/{tool_name}")
async def unregister_mcp_tool(tool_name: str):
    """Unregister an MCP tool."""
    proxy = get_mcp_proxy()
    proxy.unregister_tool(tool_name)
    return {"status": "unregistered", "tool_name": tool_name}
