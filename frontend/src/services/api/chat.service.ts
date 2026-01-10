/**
 * Chat Service
 * Chat/Query API operations
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { QueryResponse } from '@/types';

export interface QueryOptions {
    include_sources?: boolean;
    include_context?: boolean;
}

export const chatService = {
    /**
     * Send a query to the AI assistant
     */
    async sendQuery(query: string, options: QueryOptions = {}): Promise<QueryResponse> {
        return apiClient.post<QueryResponse>(API_ENDPOINTS.CHAT.QUERY, {
            query: query.trim(),
            options: {
                include_sources: options.include_sources ?? true,
                include_context: options.include_context ?? false,
            },
        });
    },

    /**
     * Check API health status
     */
    async checkHealth(): Promise<boolean> {
        try {
            await apiClient.get(API_ENDPOINTS.CHAT.HEALTH);
            return true;
        } catch {
            return false;
        }
    },
};
