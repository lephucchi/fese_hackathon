/**
 * API Client
 * Centralized HTTP client for API requests
 */

import { API_BASE_URL } from '@/utils/constants';

interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { body, headers, ...rest } = options;

        const config: RequestInit = {
            ...rest,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            credentials: 'include',
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.detail?.message || errorData.message || 'Request failed',
                response.status,
                errorData
            );
        }

        return response.json();
    }

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
    }

    async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
