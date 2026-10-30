# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

project-skeleton

## Roadmap

### project-skeleton — Project Skeleton & Core Infrastructure

Status: done

Acceptance:
- FastAPI backend with main.py entrypoint
- React + TypeScript + Vite frontend
- SQLite persistent storage with models
- Dockerfiles for backend and frontend
- docker-compose.yaml with Keycloak
- CI workflow for backend and frontend tests
- README with install/run/test steps
- portfolio.json with required metadata
- LICENSE, CHANGELOG, .gitignore, .env.example

Implementation: `backend/app/main.py`, `backend/app/api/routes.py`, `backend/app/models/__init__.py`, `backend/app/services/__init__.py`, `backend/app/services/compression.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/requirements.txt`, `frontend/package.json`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/vite-env.d.ts`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Dashboard.tsx`, `frontend/src/components/Compression.tsx`, `frontend/src/components/Sessions.tsx`, `frontend/src/components/Policies.tsx`, `frontend/src/components/Docs.tsx`, `frontend/src/api/client.ts`, `frontend/src/api/index.ts`, `frontend/src/types/api.ts`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `compose.yaml`, `README.md`, `portfolio.json`

Tests: `backend/tests/test_health.py`, `backend/tests/test_models.py`, `frontend/src/App.test.tsx`

### token-compression-engine — Token Compression Engine (Caveman-style)

Status: planned

Acceptance:
- Deterministic compression algorithm that reduces tokens by ~65%
- Caveman-speak transformation (simplified vocabulary)
- Recovery mechanism for compressed content
- API endpoints for compress/recover/analyze
- Metrics tracking (tokens before/after/saved)

Implementation: `backend/app/services/compression.py`, `backend/app/api/compression.py`, `backend/app/models/compression.py`, `frontend/src/components/CompressionDashboard.tsx`, `frontend/src/api/compression.ts`

Tests: `backend/tests/test_compression.py`, `frontend/src/components/CompressionDashboard.test.tsx`

### mcp-proxy-integration — MCP Proxy Integration for Agent Compression

Status: planned

Acceptance:
- MCP server implementation for tool retrieval
- Proxy mode that intercepts agent requests
- Print mode vs interactive mode handling
- Session tracking and statistics

Implementation: `backend/app/services/mcp_proxy.py`, `backend/app/api/mcp.py`, `frontend/src/components/MCPStatus.tsx`

Tests: `backend/tests/test_mcp_proxy.py`

### auth-oidc-keycloak — OIDC Authentication with Keycloak

Status: planned

Acceptance:
- Keycloak realm configuration
- Authorization code flow with PKCE
- Role-based access (viewer/operator/admin)
- Protected API endpoints
- Frontend login/logout flow

Implementation: `backend/app/core/auth.py`, `backend/app/api/auth.py`, `frontend/src/components/Auth.tsx`, `keycloak/realm-export.json`

Tests: `backend/tests/test_auth.py`

### llm-adapters — Multi-provider LLM Adapters

Status: planned

Acceptance:
- OpenAI-compatible adapter (LiteLLM/OpenRouter/Ollama)
- Anthropic messages adapter
- Gemini generateContent adapter
- Configurable provider/model/endpoint
- Redacted error handling

Implementation: `backend/app/services/llm_adapters.py`, `backend/app/api/llm.py`

Tests: `backend/tests/test_llm_adapters.py`

### workflows-dashboard — Three Core Workflows Dashboard

Status: planned

Acceptance:
- Workflow 1: Token Compression Analysis
- Workflow 2: Agent Session Monitoring
- Workflow 3: Compression Policy Management
- Loading/error/empty states
- Export functionality

Implementation: `frontend/src/components/WorkflowsDashboard.tsx`, `frontend/src/components/Workflow1Compression.tsx`, `frontend/src/components/Workflow2Monitoring.tsx`, `frontend/src/components/Workflow3Policy.tsx`

Tests: `frontend/src/components/WorkflowsDashboard.test.tsx`

