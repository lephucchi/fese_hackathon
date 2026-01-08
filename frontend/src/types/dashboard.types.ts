/**
 * Dashboard Type Definitions
 * Following principles: Clear naming, Single responsibility, Type safety
 */

/**
 * Represents a market news article
 */
export interface NewsArticle {
  readonly id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  tags: readonly string[];
  imageUrl?: string;
  impact?: NewsImpact;
}

/**
 * News impact on portfolio
 */
export interface NewsImpact {
  type: 'positive' | 'negative' | 'neutral';
  affectedSymbols: readonly string[];
  description: string;
}

/**
 * User's portfolio data
 */
export interface Portfolio {
  readonly id: string;
  totalValue: number;
  todayProfitLoss: number;
  todayProfitLossPercent: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positions: readonly PortfolioPosition[];
}

/**
 * Individual position in portfolio
 */
export interface PortfolioPosition {
  readonly symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

/**
 * Daily synthesis report
 */
export interface SynthesisReport {
  readonly date: Date;
  overview: string;
  positiveFactors: readonly string[];
  negativeFactors: readonly string[];
  aiRecommendations: readonly string[];
}

/**
 * Educational content
 */
export interface AcademyContent {
  readonly id: string;
  title: string;
  description: string;
  contentType: 'article' | 'video' | 'course';
  duration: number; // in minutes
  isPremium: boolean;
  pointsCost: number;
  thumbnailUrl?: string;
  category: string;
}

/**
 * User profile data
 */
export interface UserProfile {
  readonly id: string;
  name: string;
  avatarUrl?: string;
  points: number;
}

/**
 * Tab identifiers
 */
export type TabId = 'market' | 'personal' | 'academy';

/**
 * Swipe action types for news cards
 */
export type SwipeAction = 'accept' | 'reject';

/**
 * Saved news item in user's collection
 */
export interface SavedNews extends NewsArticle {
  readonly savedAt: Date;
}
