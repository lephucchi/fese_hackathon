/**
 * API Constants
 * Centralized API configuration
 */

// Validate API URL is set - NO FALLBACK
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  console.error('FATAL: NEXT_PUBLIC_API_URL environment variable is not set!');
}

export const API_BASE_URL = apiUrl || '';

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
        QUERY: '/api/market/chat',
        HEALTH: '/api/health',
    },

    // Market
    MARKET: {
        STACK: '/api/market/stack',
        INTERACTIONS: '/api/interactions',
    },
} as const;
