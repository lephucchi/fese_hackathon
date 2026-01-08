/**
 * Dashboard Page
 * Responsibility: Main dashboard layout and data orchestration
 * Follows: Component composition, separation of concerns
 */
'use client';

import { 
  DashboardHeader,
  TabContainer,
  MarketTab,
  PersonalTab,
  AcademyTab,
  FloatingChatButton,
} from '@/components/dashboard';
import { useDashboard } from '@/hooks/useDashboard';
import {
  getMockUser,
  getMockNewsArticles,
  getMockPortfolio,
  getMockSynthesisReport,
  getMockAcademyContent,
} from '@/lib/mockData';

/**
 * Main Dashboard Page Component
 */
export default function DashboardPage() {
  // Get dashboard state and handlers
  const {
    activeTab,
    savedArticles,
    handleTabChange,
    handleSaveArticle,
    handleOpenChat,
    handleContentClick,
    handleEditPortfolio,
  } = useDashboard();

  // Get data (in production, these would be async API calls)
  const user = getMockUser();
  const newsArticles = getMockNewsArticles();
  const portfolio = getMockPortfolio();
  const synthesisReport = getMockSynthesisReport();
  const academyContent = getMockAcademyContent();

  return (
    <div className="dashboard-container">
      <DashboardHeader
        activeTab={activeTab}
        user={user}
        onTabChange={handleTabChange}
      />

      <main className="main-container">
        <TabContainer id="market" activeTab={activeTab}>
          <MarketTab
            articles={newsArticles}
            savedArticles={savedArticles}
            onSaveArticle={handleSaveArticle}
          />
        </TabContainer>

        <TabContainer id="personal" activeTab={activeTab}>
          <PersonalTab
            portfolio={portfolio}
            report={synthesisReport}
            onEditPortfolio={handleEditPortfolio}
          />
        </TabContainer>

        <TabContainer id="academy" activeTab={activeTab}>
          <AcademyTab
            personalizedContent={academyContent.personalized}
            popularContent={academyContent.popular}
            onContentClick={handleContentClick}
          />
        </TabContainer>
      </main>

      <FloatingChatButton onClick={handleOpenChat} />
    </div>
  );
}
