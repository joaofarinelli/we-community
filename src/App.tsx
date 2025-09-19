import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import { useCompanyContextWatcher } from "@/hooks/useCompanyContextWatcher";
import { CompanyContextWrapper } from "@/components/CompanyContextWrapper";
import { CrossDomainAuthProvider } from "@/hooks/useCrossDomainAuth";
import { useDynamicTitle } from "@/hooks/useDynamicTitle";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthenticatedMaintenanceGuard } from "@/components/AuthenticatedMaintenanceGuard";
import { MultiCompanyGuard } from "@/components/MultiCompanyGuard";
import { useSubdomain } from "@/hooks/useSubdomain";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { RankingPage } from "./pages/RankingPage";
import { SpaceView } from "./pages/SpaceView";
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserViewPage } from '@/pages/admin/AdminUserViewPage';
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminLevelsPage } from "./pages/admin/AdminLevelsPage";
import { AdminAccessGroupsPage } from "./pages/admin/AdminAccessGroupsPage";
import { AdminSegmentsPage } from "./pages/admin/AdminSegmentsPage";
import { AdminSpacesPage } from "./pages/admin/AdminSpacesPage";
import { AdminTagsPage } from "./pages/admin/AdminTagsPage";
import { AdminUserEditPage } from "./pages/admin/AdminUserEditPage";
import { AdminProfileFieldsPage } from "./pages/admin/AdminProfileFieldsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import CertificateVerificationPage from "./pages/CertificateVerificationPage";
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { LessonPlayerPage } from "./pages/LessonPlayerPage";
import { AdminCoursesPage } from "./pages/admin/AdminCoursesPage";
import { AdminCourseModulesPage } from "./pages/admin/AdminCourseModulesPage";
import { AdminModuleLessonsPage } from "./pages/admin/AdminModuleLessonsPage";
import { AdminEssayReviewsPage } from "./pages/admin/AdminEssayReviewsPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { MarketplacePurchasesPage } from "./pages/MarketplacePurchasesPage";
import { AdminMarketplacePage } from "./pages/admin/AdminMarketplacePage";
import { AdminMarketplaceModerationPage } from "./pages/admin/AdminMarketplaceModerationPage";
import { AdminMarketplaceTermsPage } from "./pages/admin/AdminMarketplaceTermsPage";
import { StorePage } from "./pages/StorePage";
import { AdminStorePage } from "./pages/admin/AdminStorePage";
import { AdminStoreCategoriesPage } from "./pages/admin/AdminStoreCategoriesPage";
import MyItemsPage from "./pages/MyItemsPage";
import { MembersPage } from "./pages/MembersPage";
import { AdminChallengesPage } from "./pages/admin/AdminChallengesPage";
import { AdminChallengeSubmissionsPage } from "./pages/admin/AdminChallengeSubmissionsPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { BankPage } from "./pages/BankPage";
import { CalendarPage } from "./pages/CalendarPage";
import { SpacesPage } from "./pages/SpacesPage";
import EventDetailPage from "./pages/EventDetailPage";
import PostDetailPage from "./pages/PostDetailPage";
import { SuperAdminGuard } from "@/components/super-admin/SuperAdminGuard";
import { SuperAdminDashboard } from "./pages/super-admin/SuperAdminDashboard";
import { SuperAdminCompanies } from "./pages/super-admin/SuperAdminCompanies";
import { SuperAdminMetrics } from "./pages/super-admin/SuperAdminMetrics";
import { SuperAdminReports } from "./pages/super-admin/SuperAdminReports";
import SuperAdminManagement from "./pages/super-admin/SuperAdminManagement";
import { SuperAdminBugReportsConfig } from "./pages/super-admin/SuperAdminBugReportsConfig";
import { TrailsPage } from "./pages/TrailsPage";
import { AdminTrailsPage } from "./pages/admin/AdminTrailsPage";
import AdminTrailBadgesPage from "./pages/admin/AdminTrailBadgesPage";
import { TrailStagesPage } from "./pages/TrailStagesPage";
import { TrailStagePlayerPage } from "./pages/TrailStagePlayerPage";
import { AdminContentPostsPage } from "./pages/admin/AdminContentPostsPage";
import { AdminContentCategoriesPage } from "./pages/admin/AdminContentCategoriesPage";
import { AdminContentSpacesPage } from "./pages/admin/AdminContentSpacesPage";
import { AdminContentModerationPage } from "./pages/admin/AdminContentModerationPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminOnboardingPage } from "./pages/admin/AdminOnboardingPage";
import { AdminActivityLogsPage } from "./pages/admin/AdminActivityLogsPage";
import AdminBulkActionsPage from "./pages/admin/AdminBulkActionsPage";
import { BulkActionCreateEditPage } from "./pages/admin/BulkActionCreateEditPage";
import { BulkActionExecutionsPage } from "./pages/admin/BulkActionExecutionsPage";
import { LikedLessonsPage } from "./pages/LikedLessonsPage";
import { LessonNotesPage } from "./pages/LessonNotesPage";
import { AdminFinancialConfigPage } from "./pages/admin/AdminFinancialConfigPage";
import { AdminFinancialTransactionsPage } from "./pages/admin/AdminFinancialTransactionsPage";
import { AdminFinancialReportsPage } from "./pages/admin/AdminFinancialReportsPage";
import { AdminFinancialReconciliationPage } from "./pages/admin/AdminFinancialReconciliationPage";
import { TMBProductsPage } from "./pages/admin/TMBProductsPage";
import { AdminEventsReportsPage } from "./pages/admin/AdminEventsReportsPage";
import NotFound from "./pages/NotFound";
import { FaviconApplier } from '@/components/FaviconApplier';
import { OnboardingChecker } from '@/components/onboarding/OnboardingChecker';
import { AnnouncementProvider } from '@/components/ui/AnnouncementProvider';
import { QueryDebugger } from '@/components/debug/QueryDebugger';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import { MaintenancePage } from '@/pages/MaintenancePage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { UrlNormalizer } from '@/components/UrlNormalizer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes 
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

// Component to watch company context changes and manage cache
const AppContextWatcher = ({ children }: { children: React.ReactNode }) => {
  useCompanyContextWatcher();
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { subdomain, customDomain, isLoading: subdomainLoading } = useSubdomain();
  useDynamicTitle();

  if (loading || subdomainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Check if we're on the main domain (weplataforma.com.br)
  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'weplataforma.com.br';
  
  // If we're not on the main domain and have a subdomain/custom domain, redirect to auth
  const shouldShowAuthAsHome = !isMainDomain && (subdomain || customDomain);

  return (
    <CompanyContextWrapper>
      <AppContextWatcher>
        <AnnouncementProvider />
        <QueryDebugger />
        <UrlNormalizer>
        <Routes>
        {/* Public routes - no authentication or company context required */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : (shouldShowAuthAsHome ? <AuthPage /> : <Index />)} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />
        <Route path="/certificate/:certificateCode" element={<CertificateVerificationPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        
        {/* Fallback routes for double slashes */}
        <Route path="//reset-password" element={<Navigate to="/reset-password" replace />} />
        <Route path="//auth" element={<Navigate to="/auth" replace />} />
        
        {/* Protected routes - require authentication and company context */}
        <Route path="/dashboard/*" element={
          <MultiCompanyGuard>
            <OnboardingChecker />
            <Routes>
              <Route path="/" element={<AuthenticatedMaintenanceGuard><Dashboard /></AuthenticatedMaintenanceGuard>} />
              <Route path="/ranking" element={<AuthenticatedMaintenanceGuard><RankingPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/members" element={<AuthenticatedMaintenanceGuard><MembersPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/space/:spaceId" element={<AuthenticatedMaintenanceGuard><SpaceView /></AuthenticatedMaintenanceGuard>} />
              <Route path="/space/:spaceId/post/:postId" element={<AuthenticatedMaintenanceGuard><PostDetailPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/courses" element={<AuthenticatedMaintenanceGuard><CoursesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/marketplace" element={<AuthenticatedMaintenanceGuard><MarketplacePage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/store" element={<AuthenticatedMaintenanceGuard><StorePage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/marketplace/purchases" element={<AuthenticatedMaintenanceGuard><MarketplacePurchasesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/challenges" element={<AuthenticatedMaintenanceGuard><ChallengesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/bank" element={<AuthenticatedMaintenanceGuard><BankPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/calendar" element={<AuthenticatedMaintenanceGuard><CalendarPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/spaces" element={<AuthenticatedMaintenanceGuard><SpacesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/events/:eventId" element={<AuthenticatedMaintenanceGuard><EventDetailPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/trails" element={<AuthenticatedMaintenanceGuard><TrailsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/trails/:trailId/stages" element={<AuthenticatedMaintenanceGuard><TrailStagesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/trails/:trailId/stage/:stageId" element={<AuthenticatedMaintenanceGuard><TrailStagePlayerPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/certificates" element={<AuthenticatedMaintenanceGuard><CertificatesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/liked-lessons" element={<AuthenticatedMaintenanceGuard><LikedLessonsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/lesson-notes" element={<AuthenticatedMaintenanceGuard><LessonNotesPage /></AuthenticatedMaintenanceGuard>} />
            </Routes>
          </MultiCompanyGuard>
        } />
        
        <Route path="/courses/*" element={
          <MultiCompanyGuard>
            <OnboardingChecker />
            <Routes>
              <Route path="/" element={<AuthenticatedMaintenanceGuard><CoursesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/:courseId/modules/:moduleId" element={<AuthenticatedMaintenanceGuard><ModuleDetailPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/:courseId/modules/:moduleId/lessons/:lessonId" element={<AuthenticatedMaintenanceGuard><LessonPlayerPage /></AuthenticatedMaintenanceGuard>} />
            </Routes>
          </MultiCompanyGuard>
        } />
        
        <Route path="/my-items" element={
          <MultiCompanyGuard>
            <OnboardingChecker />
            <AuthenticatedMaintenanceGuard><MyItemsPage /></AuthenticatedMaintenanceGuard>
          </MultiCompanyGuard>
        } />
        
        <Route path="/admin/*" element={
          <MultiCompanyGuard>
            <OnboardingChecker />
            <Routes>
              <Route path="/users" element={<AuthenticatedMaintenanceGuard><AdminUsersPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/users/:userId" element={<AuthenticatedMaintenanceGuard><AdminUserViewPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/settings" element={<AuthenticatedMaintenanceGuard><AdminSettingsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/levels" element={<AuthenticatedMaintenanceGuard><AdminLevelsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/access-groups" element={<AuthenticatedMaintenanceGuard><AdminAccessGroupsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/spaces" element={<AuthenticatedMaintenanceGuard><AdminSpacesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/segments" element={<AuthenticatedMaintenanceGuard><AdminSegmentsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/tags" element={<AuthenticatedMaintenanceGuard><AdminTagsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/profile-fields" element={<AuthenticatedMaintenanceGuard><AdminProfileFieldsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/onboarding" element={<AuthenticatedMaintenanceGuard><AdminOnboardingPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/users/:userId/edit" element={<AuthenticatedMaintenanceGuard><AdminUserEditPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/courses" element={<AuthenticatedMaintenanceGuard><AdminCoursesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/courses/:courseId/modules" element={<AuthenticatedMaintenanceGuard><AdminCourseModulesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/courses/:courseId/modules/:moduleId/lessons" element={<AuthenticatedMaintenanceGuard><AdminModuleLessonsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/quiz-reviews" element={<AuthenticatedMaintenanceGuard><AdminEssayReviewsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/marketplace" element={<AuthenticatedMaintenanceGuard><AdminMarketplacePage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/marketplace/moderation" element={<AuthenticatedMaintenanceGuard><AdminMarketplaceModerationPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/marketplace/terms" element={<AuthenticatedMaintenanceGuard><AdminMarketplaceTermsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/store" element={<AuthenticatedMaintenanceGuard><AdminStorePage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/store/categories" element={<AuthenticatedMaintenanceGuard><AdminStoreCategoriesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/challenges" element={<AuthenticatedMaintenanceGuard><AdminChallengesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/challenges/submissions" element={<AuthenticatedMaintenanceGuard><AdminChallengeSubmissionsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/challenge-submissions" element={<AuthenticatedMaintenanceGuard><AdminChallengeSubmissionsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/activity-logs" element={<AuthenticatedMaintenanceGuard><AdminActivityLogsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/trails" element={<AuthenticatedMaintenanceGuard><AdminTrailsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/trail-badges" element={<AuthenticatedMaintenanceGuard><AdminTrailBadgesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/content/posts" element={<AuthenticatedMaintenanceGuard><AdminContentPostsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/content/categories" element={<AuthenticatedMaintenanceGuard><AdminContentCategoriesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/content/spaces" element={<AuthenticatedMaintenanceGuard><AdminContentSpacesPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/content/moderation" element={<AuthenticatedMaintenanceGuard><AdminContentModerationPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/bulk-actions" element={<AuthenticatedMaintenanceGuard><AdminBulkActionsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/bulk-actions/create" element={<AuthenticatedMaintenanceGuard><BulkActionCreateEditPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/bulk-actions/:id/edit" element={<AuthenticatedMaintenanceGuard><BulkActionCreateEditPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/bulk-actions/:id/executions" element={<AuthenticatedMaintenanceGuard><BulkActionExecutionsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/analytics" element={<AuthenticatedMaintenanceGuard><AdminAnalyticsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/financial/config" element={<AuthenticatedMaintenanceGuard><AdminFinancialConfigPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/financial/transactions" element={<AuthenticatedMaintenanceGuard><AdminFinancialTransactionsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/financial/reports" element={<AuthenticatedMaintenanceGuard><AdminFinancialReportsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/financial/reconciliation" element={<AuthenticatedMaintenanceGuard><AdminFinancialReconciliationPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/events/reports" element={<AuthenticatedMaintenanceGuard><AdminEventsReportsPage /></AuthenticatedMaintenanceGuard>} />
              <Route path="/tmb/products" element={<AuthenticatedMaintenanceGuard><TMBProductsPage /></AuthenticatedMaintenanceGuard>} />
            </Routes>
          </MultiCompanyGuard>
        } />
        
        <Route path="/super-admin/*" element={
          <MultiCompanyGuard>
            <OnboardingChecker />
            <Routes>
              <Route path="/" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
              <Route path="/companies" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminCompanies /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
              <Route path="/metrics" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminMetrics /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
              <Route path="/reports" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminReports /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
              <Route path="/management" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminManagement /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
              <Route path="/bug-reports-config" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminBugReportsConfig /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
            </Routes>
          </MultiCompanyGuard>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
        </Routes>
        </UrlNormalizer>
      </AppContextWatcher>
    </CompanyContextWrapper>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <CrossDomainAuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {/* Apply favicon dynamically per company */}
                <FaviconApplier />
                <AppRoutes />
              </TooltipProvider>
            </ThemeProvider>
          </CrossDomainAuthProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
