/**
 * Dashboard Components Export
 * Re-exports from news, personal, and education folders for backward compatibility
 * Also exports shared dashboard components
 */

// ============================================
// NEWS COMPONENTS (from components/news/)
// ============================================
export { MarketTab, NewsCard, SwipeCardStack, SwipeActions, SavedNewsList, CompletionScreen } from '../news';
export type { NewsCard as NewsCardType } from '../news';

// ============================================
// PERSONAL COMPONENTS (from components/personal/)
// ============================================
export {
    PersonalTab,
    PortfolioCard,
    AddPositionForm,
    ProfileCard,
    SynthesisReportComponent,
    PortfolioChart,
    PortfolioStats
} from '../personal';

// ============================================
// EDUCATION COMPONENTS (from components/education/)
// ============================================
export { AcademyTab } from '../education';
export type { VideoContent } from '../education';

// ============================================
// SHARED DASHBOARD COMPONENTS (remain in dashboard/)
// ============================================
export { DashboardHeader } from './DashboardHeader';
export { TabContainer } from './TabContainer';
export { FloatingChatButton } from './FloatingChatButton';
export { ContentCard } from './ContentCard';
