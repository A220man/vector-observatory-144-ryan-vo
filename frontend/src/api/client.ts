import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { CompressionRequest, CompressionResponse, SessionCreate, SessionResponse, SessionStats, PolicyCreate, PolicyResponse, HealthResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        const token = sessionStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth on unauthorized
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
        }
        return Promise.reject(error);
      }
    );
  }

  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async compress(request: CompressionRequest): Promise<CompressionResponse> {
    const response = await this.client.post<CompressionResponse>('/compress', request);
    return response.data;
  }

  async createSession(request: SessionCreate): Promise<SessionResponse> {
    const response = await this.client.post<SessionResponse>('/sessions', request);
    return response.data;
  }

  async listSessions(params?: {
    limit?: number;
    offset?: number;
    agent_framework?: string;
    session_type?: string;
  }): Promise<SessionResponse[]> {
    const response = await this.client.get<SessionResponse[]>('/sessions', { params });
    return response.data;
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await this.client.get<SessionResponse>(`/sessions/${sessionId}`);
    return response.data;
  }

  async getSessionRecords(sessionId: string, params?: { limit?: number; offset?: number }): Promise<CompressionResponse[]> {
    const response = await this.client.get<CompressionResponse[]>(`/sessions/${sessionId}/records`, { params });
    return response.data;
  }

  async getStats(): Promise<SessionStats> {
    const response = await this.client.get<SessionStats>('/stats');
    return response.data;
  }

  async createPolicy(request: PolicyCreate): Promise<PolicyResponse> {
    const response = await this.client.post<PolicyResponse>('/policies', request);
    return response.data;
  }

  async listPolicies(): Promise<PolicyResponse[]> {
    const response = await this.client.get<PolicyResponse[]>('/policies');
    return response.data;
  }

  async getPolicy(policyId: number): Promise<PolicyResponse> {
    const response = await this.client.get<PolicyResponse>(`/policies/${policyId}`);
    return response.data;
  }
}

export const api = new ApiClient();