export type CompressionMode = 'compress' | 'ultracave' | 'passthrough';
export type CompressionProfile = 'full-safe' | 'balanced' | 'aggressive';
export type SessionType = 'interactive' | 'print' | 'unknown';
export type AgentFramework = 'claude-code' | 'opencode' | 'antigravity-cli' | 'cursor' | 'windsurf' | 'other';

export interface CompressionRequest {
  text: string;
  session_id?: string;
  agent_framework?: AgentFramework;
  session_type?: SessionType;
  mode?: CompressionMode;
  profile?: CompressionProfile;
}

export interface CompressionResponse {
  session_id: string;
  request_id: string;
  original_text: string;
  compressed_text: string;
  tokens_before: number;
  tokens_after: number;
  tokens_saved: number;
  compression_ratio: number;
  recovery_ref: string;
  mode: CompressionMode;
  profile: CompressionProfile;
}

export interface SessionCreate {
  agent_framework?: AgentFramework;
  session_type?: SessionType;
  mode?: CompressionMode;
  profile?: CompressionProfile;
}

export interface SessionResponse {
  session_id: string;
  agent_framework: AgentFramework;
  session_type: SessionType;
  mode: CompressionMode;
  profile: CompressionProfile;
  total_requests: number;
  eligible_requests: number;
  total_tokens_before: number;
  total_tokens_after: number;
  total_tokens_saved: number;
  mcp_connected: boolean;
  recovery_via_mcp: boolean;
  started_at: string;
  ended_at: string | null;
  last_activity_at: string | null;
}

export interface SessionStats {
  total_sessions: number;
  total_requests: number;
  total_tokens_before: number;
  total_tokens_after: number;
  total_tokens_saved: number;
  average_compression_ratio: number;
  by_framework: Record<string, { sessions: number; tokens_saved: number }>;
  by_mode: Record<string, { sessions: number; tokens_saved: number }>;
  by_session_type: Record<string, { sessions: number; tokens_saved: number }>;
}

export interface PolicyCreate {
  name: string;
  description?: string;
  mode?: CompressionMode;
  profile?: CompressionProfile;
  target_frameworks?: AgentFramework[];
  min_tokens_threshold?: number;
  max_output_tokens?: number;
  enabled?: boolean;
  is_default?: boolean;
}

export interface PolicyResponse {
  id: number;
  name: string;
  description: string | null;
  mode: CompressionMode;
  profile: CompressionProfile;
  target_frameworks: string | null;
  min_tokens_threshold: number;
  max_output_tokens: number;
  enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export interface ApiError {
  detail: string;
}