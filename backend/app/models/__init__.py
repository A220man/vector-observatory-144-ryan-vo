import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    BigInteger,
    Float,
    Boolean,
)
from sqlalchemy.orm import relationship, declarative_mixin
from typing import Optional

from app.core.database import Base


class CompressionMode(str, enum.Enum):
    COMPRESS = "compress"
    ULTRACAVE = "ultracave"
    PASSTHROUGH = "passthrough"


class CompressionProfile(str, enum.Enum):
    FULL_SAFE = "full-safe"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"


class SessionType(str, enum.Enum):
    INTERACTIVE = "interactive"
    PRINT = "print"
    UNKNOWN = "unknown"


class AgentFramework(str, enum.Enum):
    CLAUDE_CODE = "claude-code"
    OPENCODE = "opencode"
    ANTIGRAVITY = "antigravity-cli"
    CURSOR = "cursor"
    WINDSURF = "windsurf"
    OTHER = "other"


class CompressionRecord(Base):
    __tablename__ = "compression_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, index=True)
    request_id = Column(String(64), nullable=False, index=True)
    agent_framework = Column(Enum(AgentFramework), nullable=False, default=AgentFramework.OTHER)
    session_type = Column(Enum(SessionType), nullable=False, default=SessionType.UNKNOWN)

    mode = Column(Enum(CompressionMode), nullable=False, default=CompressionMode.COMPRESS)
    profile = Column(Enum(CompressionProfile), nullable=False, default=CompressionProfile.FULL_SAFE)

    tokens_before = Column(BigInteger, nullable=False, default=0)
    tokens_after = Column(BigInteger, nullable=False, default=0)
    tokens_saved = Column(BigInteger, nullable=False, default=0)
    compression_ratio = Column(Float, nullable=False, default=0.0)

    input_text_hash = Column(String(64), nullable=True)
    output_text_hash = Column(String(64), nullable=True)

    recovery_ref = Column(String(128), nullable=True)
    mcp_recovery_used = Column(Boolean, nullable=False, default=False)

    status = Column(String(32), nullable=False, default="success")
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_compression_session_created", "session_id", "created_at"),
        Index("ix_compression_framework_mode", "agent_framework", "mode"),
    )


class SessionRecord(Base):
    __tablename__ = "session_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    agent_framework = Column(Enum(AgentFramework), nullable=False, default=AgentFramework.OTHER)
    session_type = Column(Enum(SessionType), nullable=False, default=SessionType.UNKNOWN)

    mode = Column(Enum(CompressionMode), nullable=False, default=CompressionMode.COMPRESS)
    profile = Column(Enum(CompressionProfile), nullable=False, default=CompressionProfile.FULL_SAFE)

    total_requests = Column(Integer, nullable=False, default=0)
    eligible_requests = Column(Integer, nullable=False, default=0)
    total_tokens_before = Column(BigInteger, nullable=False, default=0)
    total_tokens_after = Column(BigInteger, nullable=False, default=0)
    total_tokens_saved = Column(BigInteger, nullable=False, default=0)

    mcp_connected = Column(Boolean, nullable=False, default=False)
    recovery_via_mcp = Column(Boolean, nullable=False, default=False)

    started_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    last_activity_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_session_framework_started", "agent_framework", "started_at"),
    )


class CompressionPolicy(Base):
    __tablename__ = "compression_policies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    mode = Column(Enum(CompressionMode), nullable=False, default=CompressionMode.COMPRESS)
    profile = Column(Enum(CompressionProfile), nullable=False, default=CompressionProfile.FULL_SAFE)

    target_frameworks = Column(Text, nullable=True)  # JSON array of AgentFramework values
    min_tokens_threshold = Column(Integer, nullable=False, default=100)
    max_output_tokens = Column(Integer, nullable=False, default=8192)

    enabled = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(64), nullable=True, index=True)
    entity_id = Column(String(64), nullable=True, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)

    details = Column(Text, nullable=True)  # JSON
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(256), nullable=True)

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (
        Index("ix_audit_event_created", "event_type", "created_at"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
    )