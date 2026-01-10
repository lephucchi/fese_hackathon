/**
 * Auth Service
 * Authentication API operations
 */

import { apiClient, ApiError } from './client';
import { API_ENDPOINTS } from '@/utils/constants';

export interface User {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    risk_appetite?: string;
    created_at?: string;
}

export interface LoginResponse {
    user: User;
    access_token?: string;
}

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    display_name?: string;
}

export const authService = {
    /**
     * Login user with email and password
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    },

    /**
     * Register new user
     */
    async register(data: RegisterData): Promise<LoginResponse> {
        return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.REGISTER, {
            email: data.email,
            password: data.password,
            first_name: data.first_name,
            last_name: data.last_name,
            display_name: data.display_name || `${data.first_name} ${data.last_name}`,
        });
    },

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    },

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<boolean> {
        try {
            await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
            return true;
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return false;
            }
            throw error;
        }
    },
};
