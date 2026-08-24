import { GraphData, PackageNode, CircularResponse, HealthResponse } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;
  public isDatabaseError: boolean;

  constructor(message: string, statusCode: number = 500, details?: any, isDatabaseError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isDatabaseError = isDatabaseError;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 503) {
        throw new ApiError(
          data?.error || 'Database unavailable',
          503,
          data?.details || 'Cannot connect to CognoDB graph instance.',
          true
        );
      }
      throw new ApiError(
        data?.error || `Request failed with status ${res.status}`,
        res.status,
        data?.details
      );
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection errors
    throw new ApiError(
      'Cannot connect to backend server',
      0,
      error?.message || 'Network error or backend is not running.',
      true
    );
  }
}

export const api = {
  searchPackages: async (term: string): Promise<PackageNode[]> => {
    if (!term.trim()) return [];
    return request<PackageNode[]>(`/api/packages/search?q=${encodeURIComponent(term.trim())}`);
  },

  getPackageDependencies: async (name: string, depth: number = 2): Promise<GraphData> => {
    return request<GraphData>(`/api/packages/${encodeURIComponent(name)}/dependencies?depth=${depth}`);
  },

  getPackageDependents: async (name: string): Promise<PackageNode[]> => {
    return request<PackageNode[]>(`/api/packages/${encodeURIComponent(name)}/dependents`);
  },

  getCircularDependencies: async (): Promise<CircularResponse> => {
    return request<CircularResponse>('/api/packages/circular');
  },

  checkHealth: async (): Promise<HealthResponse> => {
    return request<HealthResponse>('/api/health');
  },
};
