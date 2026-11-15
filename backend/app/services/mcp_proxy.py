"""MCP (Model Context Protocol) Proxy Integration for Agent Compression.

This module provides an MCP server implementation that intercepts agent requests
for tool retrieval and compression operations. It supports both print mode and
interactive mode handling with session tracking and statistics.
"""

import asyncio
import time
import json
import logging
import uuid
from typing import Dict, Optional, Any, List

logger = logging.getLogger(__name__)


class MCPProxyError(Exception):
    """Base exception for MCP proxy errors."""
    pass


class MCPMessage:
    """Represents an MCP message format."""
    
    def __init__(
        self,
        id: Optional[str] = None,
        method: Optional[str] = None,
        params: Optional[Dict] = None,
        result: Optional[Dict] = None,
        error: Optional[Dict] = None,
    ):
        self.id = id
        self.method = method
        self.params = params or {}
        self.result = result
        self.error = error
    
    def to_dict(self) -> Dict:
        """Convert message to dictionary."""
        msg: Dict = {
            "jsonrpc": "2.0",
        }
        if self.id is not None:
            msg["id"] = self.id
        if self.method is not None:
            msg["method"] = self.method
        if self.params is not None and self.params:
            msg["params"] = self.params
        if self.result is not None:
            msg["result"] = self.result
        if self.error is not None:
            msg["error"] = self.error
        return msg
    
    @classmethod
    def from_dict(cls, data: Dict) -> "MCPMessage":
        """Create message from dictionary."""
        msg = cls(
            id=data.get("id"),
            method=data.get("method"),
            params=data.get("params", {}),
            result=data.get("result"),
            error=data.get("error"),
        )
        return msg


class MCPTool:
    """Represents an MCP tool with its metadata."""
    
    def __init__(
        self,
        name: str,
        description: str,
        input_schema: Dict[str, Any],
    ):
        self.name = name
        self.description = description
        self.input_schema = input_schema
    
    def to_dict(self) -> Dict:
        """Convert tool to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.input_schema,
        }


class MCPProxySession:
    """Represents an active MCP proxy session."""
    
    def __init__(
        self,
        session_id: str,
        agent_framework: str,
        mode: str = "interactive",  # "interactive" or "print"
        compression_profile: str = "full-safe",
    ):
        self.session_id = session_id
        self.agent_framework = agent_framework
        self.mode = mode
        self.compression_profile = compression_profile
        self.tools: List[MCPTool] = []
        self.request_count = 0
        self.compression_count = 0
        import time; self.created_at = time.time()
        self.last_activity = time.time()
    
    def to_dict(self) -> Dict:
        """Convert session to dictionary for serialization."""
        return {
            "session_id": self.session_id,
            "agent_framework": self.agent_framework,
            "mode": self.mode,
            "compression_profile": self.compression_profile,
            "tools_count": len(self.tools),
            "request_count": self.request_count,
            "compression_count": self.compression_count,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
        }
    
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = time.time()
    
    def increment_requests(self):
        """Increment request counter."""
        self.request_count += 1
        self.update_activity()
    
    def increment_compressions(self):
        """Increment compression counter."""
        self.compression_count += 1
        self.update_activity()


class MCPProxy:
    """MCP Proxy server for agent compression integration.
    
    This proxy intercepts agent requests for tool retrieval and provides
    compressed/transformed responses through the caveman compression engine.
    """
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8787):
        self.host = host
        self.port = port
        self.server: Optional[Any] = None
        self.sessions: Dict[str, MCPProxySession] = {}
        self.tools_registry: Dict[str, MCPTool] = {}
        self._running = False
    
    def register_tool(self, tool: MCPTool):
        """Register a tool in the proxy's tool registry."""
        self.tools_registry[tool.name] = tool
        logger.debug(f"Registered MCP tool: {tool.name}")
    
    def unregister_tool(self, tool_name: str):
        """Unregister a tool from the proxy's registry."""
        if tool_name in self.tools_registry:
            del self.tools_registry[tool_name]
            logger.debug(f"Unregistered MCP tool: {tool_name}")
    
    def create_session(
        self,
        agent_framework: str,
        mode: str = "interactive",
        compression_profile: str = "full-safe",
    ) -> MCPProxySession:
        """Create a new MCP proxy session."""
        session_id = str(uuid.uuid4())
        session = MCPProxySession(
            session_id=session_id,
            agent_framework=agent_framework,
            mode=mode,
            compression_profile=compression_profile,
        )
        self.sessions[session_id] = session
        logger.info(f"Created MCP proxy session: {session_id} (framework={agent_framework}, mode={mode})")
        return session
    
    def get_session(self, session_id: str) -> Optional[MCPProxySession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    def list_sessions(self) -> List[MCPProxySession]:
        """List all active sessions."""
        return list(self.sessions.values())
    
    def list_tools(self) -> List[MCPTool]:
        """List all registered tools."""
        return list(self.tools_registry.values())
    
    def has_tool(self, tool_name: str) -> bool:
        """Check if a tool is registered."""
        return tool_name in self.tools_registry
    
    async def handle_message(self, message: MCPMessage, session: MCPProxySession) -> Optional[MCPMessage]:
        """Handle an incoming MCP message for a session.
        
        Supported methods:
        - tools/list: List available tools
        - tools/call: Call a tool with parameters
        - compress: Compress text using the caveman engine
        - recover: Recover original text from compression
        - session/update: Update session parameters
        """
        method = message.method
        params = message.params or {}
        
        if method == "tools/list":
            return MCPMessage(
                id=message.id,
                result={"tools": [t.to_dict() for t in self.list_tools()]},
            )
        
        elif method == "tools/call":
            tool_name = params.get("name", "")
            tool_params = params.get("arguments", {})
            
            if not self.has_tool(tool_name):
                return MCPMessage(
                    id=message.id,
                    error={
                        "code": -32601,
                        "message": f"Tool not found: {tool_name}",
                    },
                )
            
            tool = self.tools_registry[tool_name]
            # TODO: Execute tool with parameters
            # For now, return tool metadata
            return MCPMessage(
                id=message.id,
                result={
                    "content": [{
                        "type": "text",
                        "text": f"Called tool: {tool.name}\\nDescription: {tool.description}",
                    }],
                    "isError": False,
                },
            )
        
        elif method == "compress":
            text = params.get("text", "")
            profile = params.get("profile", session.compression_profile)
            
            # Use the caveman compressor to compress text
            from app.services.compression import get_compressor, CompressionMode
            
            compressor = get_compressor(
                mode=CompressionMode.COMPRESS,
                profile=CompressionProfile[profile.upper().replace("-", "_")],
            )
            
            result = compressor.compress(text)
            session.increment_compressions()
            
            return MCPMessage(
                id=message.id,
                result={
                    "compressed": result.compressed_text,
                    "recovery_ref": result.recovery_ref,
                    "tokens_saved": result.tokens_saved,
                    "compression_ratio": result.compression_ratio,
                    "profile": profile,
                },
            )
        
        elif method == "recover":
            recovery_ref = params.get("recovery_ref", "")
            
            from app.services.compression import get_recovery_store
            
            store = get_recovery_store()
            recovered = store.get(recovery_ref)
            
            if recovered is None:
                return MCPMessage(
                    id=message.id,
                    error={
                        "code": -32603,
                        "message": f"Cannot recover: {recovery_ref}",
                    },
                )
            
            return MCPMessage(
                id=message.id,
                result={
                    "recovered_text": recovered,
                    "recovery_ref": recovery_ref,
                },
            )
        
        elif method == "session/update":
            new_mode = params.get("mode", session.mode)
            new_profile = params.get("compression_profile", session.compression_profile)
            
            if new_mode in ("interactive", "print"):
                session.mode = new_mode
            if new_profile in ("full-safe", "balanced", "aggressive"):
                session.compression_profile = new_profile
            
            session.update_activity()
            return MCPMessage(
                id=message.id,
                result={
                    "session_id": session.session_id,
                    "mode": session.mode,
                    "compression_profile": session.compression_profile,
                },
            )
        
        else:
            return MCPMessage(
                id=message.id,
                error={
                    "code": -32601,
                    "message": f"Method not found: {method}",
                },
            )
    
    async def process_connection(self, reader, writer):
        """Process a single MCP connection."""
        session_id: Optional[str] = None
        session: Optional[MCPProxySession] = None
        
        try:
            # Read the initial handshake/initialize message
            line = await asyncio.wait_for(reader.readline(), timeout=30.0)
            if not line:
                return
            
            line = line.decode().strip()
            if not line:
                return
            
            try:
                message = MCPMessage.from_dict(json.loads(line))
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse MCP message: {e}")
                writer.write(json.dumps({
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": "Parse error"},
                }).encode())
                writer.close()
                await writer.wait_closed()
                return
            
            # Handle initialization
            if message.method == "initialize":
                params = message.params or {}
                session_id = params.get("session_id", str(uuid.uuid4()))
                agent_framework = params.get("agent_framework", "unknown")
                mode = params.get("mode", "interactive")
                
                session = self.create_session(
                    agent_framework=agent_framework,
                    mode=mode,
                )
                self.sessions[session_id] = session
                
                # Send initialization response
                initialize_result = {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {},
                        "compression": {},
                    },
                    "serverInfo": {
                        "name": "vector-observatory-mcp-proxy",
                        "version": "1.0.0",
                    },
                }
                
                response = MCPMessage(
                    id=message.id,
                    result=initialize_result,
                )
                
                writer.write(json.dumps(response.to_dict()).encode() + b"\n")
                await writer.drain()
            
            # Main message loop
            while True:
                line = await asyncio.wait_for(reader.readline(), timeout=60.0)
                if not line:
                    break
                
                line = line.decode().strip()
                if not line:
                    continue
                
                try:
                    message = MCPMessage.from_dict(json.loads(line))
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Failed to parse MCP message: {e}")
                    continue
                
                if session is None:
                    logger.warning("Message received without active session")
                    continue
                
                # Update session activity
                session.increment_requests()
                
                # Handle the message
                response = await self.handle_message(message, session)
                
                if response is not None:
                    writer.write(json.dumps(response.to_dict()).encode() + b"\n")
                    await writer.drain()
        
        except asyncio.TimeoutError:
            logger.info(f"MCP connection timeout for session: {session_id}")
        except ConnectionResetError:
            logger.info(f"MCP connection reset for session: {session_id}")
        except Exception as e:
            logger.error(f"Error processing MCP connection: {e}")
        finally:
            if session and session_id and session_id in self.sessions:
                del self.sessions[session_id]
                logger.info(f"Removed MCP proxy session: {session_id}")
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass
    
    async def start(self):
        """Start the MCP proxy server."""
        if self._running:
            logger.warning("MCP proxy server already running")
            return
        
        import websockets
        from aiohttp import web
        
        # Try aiohttp first for simplicity
        try:
            app = web.Application()
            
            async def mcp_handler(request):
                # Upgrade to MCP protocol
                reader = request.transport.get_extra_info('socket').makefile('r')
                writer = request.transport.get_extra_info('socket').makefile('w')
                
                # Process connection
                # Note: In production, we'd use a proper transport setup
                await self.process_connection(reader, writer)
                return web.Response()
            
            app.router.add_get('/mcp', mcp_handler)
            
            runner = web.AppRunner(app)
            await runner.setup()
            site = web.TCPSite(runner, self.host, self.port)
            await site.start()
            
            self.server = runner
            self._running = True
            logger.info(f"MCP proxy server started on {self.host}:{self.port}")
            
        except ImportError:
            # Fallback: simple TCP server
            from setup import start_server
            
            async def handle_client(reader, writer):
                await self.process_connection(reader, writer)
            
            self.server = await start_server(handle_client, self.host, self.port)
            self._running = True
            logger.info(f"MCP proxy server started on {self.host}:{self.port}")
    
    async def stop(self):
        """Stop the MCP proxy server."""
        self._running = False
        
        if self.server:
            if hasattr(self.server, 'cleanup'):
                await self.server.cleanup()
            elif hasattr(self.server, 'close'):
                self.server.close()
                await self.server.wait_closed()
        
        self.sessions.clear()
        self.tools_registry.clear()
        logger.info("MCP proxy server stopped")


# Global proxy instance
_default_proxy: Optional[MCPProxy] = None


def get_mcp_proxy() -> MCPProxy:
    """Get the global MCP proxy instance."""
    global _default_proxy
    if _default_proxy is None:
        _default_proxy = MCPProxy()
    return _default_proxy


def setup_mcp_proxy(app, host: str = "0.0.0.0", port: int = 8787):
    """Set up MCP proxy integration with a FastAPI app."""
    proxy = MCPProxy(host=host, port=port)
    
    @app.on_event("startup")
    async def _start_proxy():
        await proxy.start()
    
    @app.on_event("shutdown")
    async def _stop_proxy():
        await proxy.stop()
    
    return proxy
