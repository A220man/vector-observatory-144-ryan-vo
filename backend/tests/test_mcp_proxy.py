import asyncio
"""MCP Proxy Integration tests for agent compression."""

import pytest
from fastapi.testclient import TestClient


class TestMCPProxyInitialization:
    """Test MCP proxy initialization and basic setup."""

    def test_proxy_initialization(self):
        """Test that MCP proxy can be initialized."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        assert proxy is not None
        assert proxy._running is False

    def test_proxy_with_host_port(self):
        """Test MCP proxy with custom host and port."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy(host="0.0.0.0", port=8787)
        assert proxy.host == "0.0.0.0"
        assert proxy.port == 8787


class TestMCPTool:
    """Test MCP tool representation."""

    def test_tool_creation(self):
        """Test creating an MCP tool."""
        from backend.app.services.mcp_proxy import MCPTool
        tool = MCPTool(
            name="test-tool",
            description="A test tool",
            input_schema={"type": "object", "properties": {}},
        )
        assert tool.name == "test-tool"
        assert tool.description == "A test tool"
        assert tool.input_schema == {"type": "object", "properties": {}}

    def test_tool_dict_serialization(self):
        """Test tool dictionary serialization."""
        from backend.app.services.mcp_proxy import MCPTool
        tool = MCPTool(
            name="test-tool",
            description="A test tool",
            input_schema={"type": "object", "properties": {}},
        )
        d = tool.to_dict()
        assert d["name"] == "test-tool"
        assert d["description"] == "A test tool"
        assert d["inputSchema"] == {"type": "object", "properties": {}}


class TestMCPProxySession:
    """Test MCP proxy session management."""

    def test_session_creation(self):
        """Test creating an MCP proxy session."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        session = proxy.create_session(
            agent_framework="claude-code",
            mode="interactive",
            compression_profile="full-safe",
        )
        assert session.session_id is not None
        assert session.agent_framework == "claude-code"
        assert session.mode == "interactive"
        assert session.compression_profile == "full-safe"
        assert session.request_count == 0
        assert session.compression_count == 0

    def test_session_mode_update(self):
        """Test updating session mode."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        session = proxy.create_session(
            agent_framework="claude-code",
            mode="interactive",
        )
        
        # Update to print mode
        session.mode = "print"
        assert session.mode == "print"
        
        # Update compression profile
        session.compression_profile = "aggressive"
        assert session.compression_profile == "aggressive"

    def test_session_counter_increment(self):
        """Test session request and compression counters."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        session = proxy.create_session(
            agent_framework="claude-code",
            mode="interactive",
        )
        
        assert session.request_count == 0
        assert session.compression_count == 0
        
        session.increment_requests()
        assert session.request_count == 1
        
        session.increment_compressions()
        assert session.compression_count == 1
        
        session.increment_requests()
        assert session.request_count == 2


class TestMCPProxy:
    """Test MCP proxy core functionality."""

    def test_register_tool(self):
        """Test registering a tool."""
        from backend.app.services.mcp_proxy import MCPProxy, MCPTool
        proxy = MCPProxy()
        tool = MCPTool(
            name="calculator",
            description="Perform calculations",
            input_schema={"type": "object", "properties": {}},
        )
        proxy.register_tool(tool)
        assert proxy.has_tool("calculator")

    def test_unregister_tool(self):
        """Test unregistering a tool."""
        from backend.app.services.mcp_proxy import MCPProxy, MCPTool
        proxy = MCPProxy()
        tool = MCPTool(
            name="calculator",
            description="Perform calculations",
            input_schema={"type": "object", "properties": {}},
        )
        proxy.register_tool(tool)
        assert proxy.has_tool("calculator")
        
        proxy.unregister_tool("calculator")
        assert not proxy.has_tool("calculator")

    def test_list_tools(self):
        """Test listing registered tools."""
        from backend.app.services.mcp_proxy import MCPProxy, MCPTool
        proxy = MCPProxy()
        tool1 = MCPTool(name="tool1", description="first", input_schema={})
        tool2 = MCPTool(name="tool2", description="second", input_schema={})
        proxy.register_tool(tool1)
        proxy.register_tool(tool2)
        
        tools = proxy.list_tools()
        assert len(tools) == 2
        assert {t.name for t in tools} == {"tool1", "tool2"}

    def test_create_and_get_session(self):
        """Test creating and retrieving a session."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        session = proxy.create_session(
            agent_framework="claude-code",
            mode="print",
        )
        
        retrieved = proxy.get_session(session.session_id)
        assert retrieved is not None
        assert retrieved.session_id == session.session_id
        assert retrieved.mode == "print"


class TestMCPMessage:
    """Test MCP message serialization/deserialization."""

    def test_message_creation(self):
        """Test creating an MCP message."""
        from backend.app.services.mcp_proxy import MCPMessage
        msg = MCPMessage(
            method="tools/list",
            id="1",
        )
        assert msg.method == "tools/list"
        assert msg.id == "1"
        assert msg.result is None
        assert msg.error is None

    def test_message_to_dict(self):
        """Test message to_dict serialization."""
        from backend.app.services.mcp_proxy import MCPMessage
        msg = MCPMessage(
            method="tools/list",
            id="1",
            result={"tools": []},
        )
        d = msg.to_dict()
        assert d["jsonrpc"] == "2.0"
        assert d["id"] == "1"
        assert d["method"] == "tools/list"
        assert d["result"] == {"tools": []}

    def test_message_from_dict(self):
        """Test message from_dict deserialization."""
        from backend.app.services.mcp_proxy import MCPMessage
        data = {
            "jsonrpc": "2.0",
            "id": "1",
            "method": "tools/list",
        }
        msg = MCPMessage.from_dict(data)
        # Verify the message was created with correct attributes
        assert msg.id == "1"
        assert msg.method == "tools/list"


class TestMCPMessageHandling:
    """Test MCP message handling in proxy."""

    def test_handle_tools_list(self):
        """Test handling tools/list method."""
        from backend.app.services.mcp_proxy import MCPProxy, MCPTool, MCPMessage
        proxy = MCPProxy()
        proxy.register_tool(MCPTool(name="test", description="test", input_schema={}))
        
        message = MCPMessage(method="tools/list", id="1")
        # Create a minimal session
        session = proxy.create_session(agent_framework="claude-code")
        proxy.sessions[session.session_id] = session
        
        # Test the handle_message logic
        # Since the session has tools registered, tools/list should work
        result = asyncio.run(proxy.handle_message(message, session))
        # Should have a result, not an error
        assert result is not None

    def test_handle_unknown_method(self):
        """Test handling unknown method returns error."""
        from backend.app.services.mcp_proxy import MCPProxy, MCPMessage
        proxy = MCPProxy()
        
        message = MCPMessage(method="unknown/method", id="1")
        session = proxy.create_session(agent_framework="claude-code")
        proxy.sessions[session.session_id] = session
        
        # The handle_message would return an error for unknown methods
        result = asyncio.run(proxy.handle_message(message, session))
        assert result is not None
        assert result.error is not None


class TestMCPSessionStatistics:
    """Test session statistics tracking."""

    def test_session_stats_accumulation(self):
        """Test that session statistics accumulate correctly."""
        from backend.app.services.mcp_proxy import MCPProxy
        proxy = MCPProxy()
        session = proxy.create_session(agent_framework="claude-code")
        
        # Simulate multiple requests and compressions
        for _ in range(5):
            session.increment_requests()
        for _ in range(3):
            session.increment_compressions()
        
        assert session.request_count == 5
        assert session.compression_count == 3
