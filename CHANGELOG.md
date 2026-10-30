# Changelog

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project skeleton with FastAPI backend and React frontend
- SQLite persistent storage with core models
- Dockerfiles and docker-compose with Keycloak
- CI workflow for backend and frontend
- Basic project documentation
- Frontend: App.tsx with React Router v6 routing
- Frontend: Policies.tsx component for compression policy management
- Frontend: Docs.tsx component with API reference and architecture docs
- Frontend: vite-env.d.ts for Vite environment type declarations

### Changed
- Frontend: Added path alias resolution in vite.config.ts
- Frontend: Fixed TypeScript compilation errors across all components
- Frontend: Updated Policies component to match API types (PolicyCreate, PolicyResponse)

### Fixed
- Frontend: Removed unused imports (FileText, Download, ChevronDown, React)
- Frontend: Fixed ImportMeta type declaration for VITE_API_URL
- Frontend: Fixed template literal escaping in Docs.tsx
- Frontend: Fixed target_frameworks type handling in Policies.tsx
- Frontend: Fixed global to globalThis in test-setup.ts

### Removed
- None
