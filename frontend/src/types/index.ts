/**
 * TypeScript Type Definitions for Frontend
 */

export interface Citation {
  number: number;
  source: string;
  preview: string;
  similarity?: number;
}

export interface ResponseMetadata {
  routes: string[];
  is_complex: boolean;
  sub_queries: string[];
  total_time_ms: number;
  step_times: Record<string, number>;
}

export interface QueryResponse {
  answer: string;
  message_id: string;
  context_used: number;
  cached: boolean;
  tier?: number;
  elapsed_ms?: number;
  history_used?: number;
  logs?: Array<{ step: string; detail: string; timestamp: number }>;
  citations?: Citation[];
  // Legacy fields (optional compatibility)
  is_grounded?: boolean;
  metadata?: ResponseMetadata;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: QueryResponse;
  isLoading?: boolean;
}

export interface QueryOptions {
  include_sources?: boolean;
  include_context?: boolean;
}

export interface APIError {
  error: string;
  message: string;
}
