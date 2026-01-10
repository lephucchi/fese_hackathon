/**
 * API Constants
 * Centralized API configuration
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
    },

    // Chat
    CHAT: {
        QUERY: '/api/query',
        HEALTH: '/api/health',
    },

    // Market
    MARKET: {
        STACK: '/api/market/stack',
        INTERACTIONS: '/api/interactions',
    },
} as const;
