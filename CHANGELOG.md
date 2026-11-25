# Changelog

## 1.7.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.6.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.5.1 — compress API endpoint

Added POST /api/v1/compress endpoint to the FastAPI backend. The endpoint accepts a CompressionRequest (text + profile) and returns a CompressionResponse with session_id, compressed_text, recovery_ref, tokens_before, tokens_after, tokens_saved, compression_ratio, and profile. Compression uses the existing CavemanCompressor service with deterministic vocabulary replacement. All 18 existing compression service tests continue to pass.

## 1.5.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.4.1 — MCP Proxy Integration

MC Proxy integration for agent compression with tool retrieval, session management, and HTTP API endpoints. Known issues: STATUS.md.

## 1.3.0 — work-in-progress checkpoint

MC Proxy integration for agent compression with tool retrieval, session management, and HTTP API endpoints. Known issues: STATUS.md.

## 1.2.0 — work-in-progress checkpoint

MC Proxy integration for agent compression with tool retrieval, session management, and HTTP API endpoints. Known issues: STATUS.md.

## 1.1.0 — work-in-progress checkpoint
