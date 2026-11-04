"""Database model tests."""

from app.models import (
    CompressionMode,
    CompressionProfile,
    SessionType,
    AgentFramework,
    CompressionRecord,
    SessionRecord,
    CompressionPolicy,
    AuditLog,
)


def test_compression_mode_enum():
    """Test CompressionMode enum values."""
    assert CompressionMode.COMPRESS == "compress"
    assert CompressionMode.ULTRACAVE == "ultracave"
    assert CompressionMode.PASSTHROUGH == "passthrough"


def test_compression_profile_enum():
    """Test CompressionProfile enum values."""
    assert CompressionProfile.FULL_SAFE == "full-safe"
    assert CompressionProfile.BALANCED == "balanced"
    assert CompressionProfile.AGGRESSIVE == "aggressive"


def test_session_type_enum():
    """Test SessionType enum values."""
    assert SessionType.INTERACTIVE == "interactive"
    assert SessionType.PRINT == "print"
    assert SessionType.UNKNOWN == "unknown"


def test_agent_framework_enum():
    """Test AgentFramework enum values."""
    assert AgentFramework.CLAUDE_CODE == "claude-code"
    assert AgentFramework.OPENCODE == "opencode"
    assert AgentFramework.ANTIGRAVITY == "antigravity-cli"
    assert AgentFramework.CURSOR == "cursor"
    assert AgentFramework.WINDSURF == "windsurf"
    assert AgentFramework.OTHER == "other"


def test_compression_record_model():
    """Test CompressionRecord model has correct columns."""
    cols = {c.name for c in CompressionRecord.__table__.columns}
    expected = {
        "id", "session_id", "request_id", "agent_framework", "session_type",
        "mode", "profile", "tokens_before", "tokens_after", "tokens_saved",
        "compression_ratio", "input_text_hash", "output_text_hash",
        "recovery_ref", "mcp_recovery_used", "status", "error_message",
        "created_at", "processed_at"
    }
    assert expected.issubset(cols)


def test_session_record_model():
    """Test SessionRecord model has correct columns."""
    cols = {c.name for c in SessionRecord.__table__.columns}
    expected = {
        "id", "session_id", "agent_framework", "session_type",
        "mode", "profile", "total_requests", "eligible_requests",
        "total_tokens_before", "total_tokens_after", "total_tokens_saved",
        "mcp_connected", "recovery_via_mcp", "started_at", "ended_at", "last_activity_at"
    }
    assert expected.issubset(cols)


def test_compression_policy_model():
    """Test CompressionPolicy model has correct columns."""
    cols = {c.name for c in CompressionPolicy.__table__.columns}
    expected = {
        "id", "name", "description", "mode", "profile", "target_frameworks",
        "min_tokens_threshold", "max_output_tokens", "enabled", "is_default",
        "created_at", "updated_at"
    }
    assert expected.issubset(cols)


def test_audit_log_model():
    """Test AuditLog model has correct columns."""
    cols = {c.name for c in AuditLog.__table__.columns}
    expected = {
        "id", "event_type", "entity_type", "entity_id", "user_id",
        "session_id", "details", "ip_address", "user_agent", "created_at"
    }
    assert expected.issubset(cols)