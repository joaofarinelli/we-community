import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
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
import NotFound from "./pages/NotFound";
import { FaviconApplier } from '@/components/FaviconApplier';
import { OnboardingChecker } from '@/components/onboarding/OnboardingChecker';
import { AnnouncementProvider } from '@/components/ui/AnnouncementProvider';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import { MaintenancePage } from '@/pages/MaintenancePage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

const queryClient = new QueryClient();

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
      <AnnouncementProvider />
      <MultiCompanyGuard>
        <OnboardingChecker />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : (shouldShowAuthAsHome ? <AuthPage /> : <Index />)} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<AuthenticatedMaintenanceGuard><Dashboard /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/ranking" element={<AuthenticatedMaintenanceGuard><RankingPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/members" element={<AuthenticatedMaintenanceGuard><MembersPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/space/:spaceId" element={<AuthenticatedMaintenanceGuard><SpaceView /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/space/:spaceId/post/:postId" element={<AuthenticatedMaintenanceGuard><PostDetailPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/users" element={<AuthenticatedMaintenanceGuard><AdminUsersPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/users/:userId" element={<AuthenticatedMaintenanceGuard><AdminUserViewPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/settings" element={<AuthenticatedMaintenanceGuard><AdminSettingsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/levels" element={<AuthenticatedMaintenanceGuard><AdminLevelsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/access-groups" element={<AuthenticatedMaintenanceGuard><AdminAccessGroupsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/spaces" element={<AuthenticatedMaintenanceGuard><AdminSpacesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/segments" element={<AuthenticatedMaintenanceGuard><AdminSegmentsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/tags" element={<AuthenticatedMaintenanceGuard><AdminTagsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/profile-fields" element={<AuthenticatedMaintenanceGuard><AdminProfileFieldsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/onboarding" element={<AuthenticatedMaintenanceGuard><AdminOnboardingPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/users/:userId/edit" element={<AuthenticatedMaintenanceGuard><AdminUserEditPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/courses" element={<AuthenticatedMaintenanceGuard><CoursesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/courses" element={<AuthenticatedMaintenanceGuard><CoursesPage /></AuthenticatedMaintenanceGuard>} />
          
          <Route path="/courses/:courseId/modules/:moduleId" element={<AuthenticatedMaintenanceGuard><ModuleDetailPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AuthenticatedMaintenanceGuard><LessonPlayerPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/courses" element={<AuthenticatedMaintenanceGuard><AdminCoursesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/courses/:courseId/modules" element={<AuthenticatedMaintenanceGuard><AdminCourseModulesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons" element={<AuthenticatedMaintenanceGuard><AdminModuleLessonsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/quiz-reviews" element={<AuthenticatedMaintenanceGuard><AdminEssayReviewsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/marketplace" element={<AuthenticatedMaintenanceGuard><MarketplacePage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/store" element={<AuthenticatedMaintenanceGuard><StorePage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/marketplace/purchases" element={<AuthenticatedMaintenanceGuard><MarketplacePurchasesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/my-items" element={<AuthenticatedMaintenanceGuard><MyItemsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/marketplace" element={<AuthenticatedMaintenanceGuard><AdminMarketplacePage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/marketplace/moderation" element={<AuthenticatedMaintenanceGuard><AdminMarketplaceModerationPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/marketplace/terms" element={<AuthenticatedMaintenanceGuard><AdminMarketplaceTermsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/store" element={<AuthenticatedMaintenanceGuard><AdminStorePage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/store/categories" element={<AuthenticatedMaintenanceGuard><AdminStoreCategoriesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/challenges" element={<AuthenticatedMaintenanceGuard><AdminChallengesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/challenges/submissions" element={<AuthenticatedMaintenanceGuard><AdminChallengeSubmissionsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/challenge-submissions" element={<AuthenticatedMaintenanceGuard><AdminChallengeSubmissionsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/challenges" element={<AuthenticatedMaintenanceGuard><ChallengesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/bank" element={<AuthenticatedMaintenanceGuard><BankPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/calendar" element={<AuthenticatedMaintenanceGuard><CalendarPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/spaces" element={<AuthenticatedMaintenanceGuard><SpacesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/events/:eventId" element={<AuthenticatedMaintenanceGuard><EventDetailPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/trails" element={<AuthenticatedMaintenanceGuard><TrailsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/trails/:trailId/stages" element={<AuthenticatedMaintenanceGuard><TrailStagesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/trails/:trailId/stage/:stageId" element={<AuthenticatedMaintenanceGuard><TrailStagePlayerPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/certificates" element={<AuthenticatedMaintenanceGuard><CertificatesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/certificate/:certificateCode" element={<CertificateVerificationPage />} />
          <Route path="/dashboard/liked-lessons" element={<AuthenticatedMaintenanceGuard><LikedLessonsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/dashboard/lesson-notes" element={<AuthenticatedMaintenanceGuard><LessonNotesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/trails" element={<AuthenticatedMaintenanceGuard><AdminTrailsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/trail-badges" element={<AuthenticatedMaintenanceGuard><AdminTrailBadgesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/content/posts" element={<AuthenticatedMaintenanceGuard><AdminContentPostsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/content/categories" element={<AuthenticatedMaintenanceGuard><AdminContentCategoriesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/content/spaces" element={<AuthenticatedMaintenanceGuard><AdminContentSpacesPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/content/moderation" element={<AuthenticatedMaintenanceGuard><AdminContentModerationPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/bulk-actions" element={<AuthenticatedMaintenanceGuard><AdminBulkActionsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/bulk-actions/create" element={<AuthenticatedMaintenanceGuard><BulkActionCreateEditPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/bulk-actions/:id/edit" element={<AuthenticatedMaintenanceGuard><BulkActionCreateEditPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/bulk-actions/:id/executions" element={<AuthenticatedMaintenanceGuard><BulkActionExecutionsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/analytics" element={<AuthenticatedMaintenanceGuard><AdminAnalyticsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/financial/config" element={<AuthenticatedMaintenanceGuard><AdminFinancialConfigPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/financial/transactions" element={<AuthenticatedMaintenanceGuard><AdminFinancialTransactionsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/financial/reports" element={<AuthenticatedMaintenanceGuard><AdminFinancialReportsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/financial/reconciliation" element={<AuthenticatedMaintenanceGuard><AdminFinancialReconciliationPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/admin/tmb/products" element={<AuthenticatedMaintenanceGuard><TMBProductsPage /></AuthenticatedMaintenanceGuard>} />
          <Route path="/super-admin" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
          <Route path="/super-admin/companies" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminCompanies /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
          <Route path="/super-admin/metrics" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminMetrics /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
          <Route path="/super-admin/reports" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminReports /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
          <Route path="/super-admin/management" element={<AuthenticatedMaintenanceGuard><SuperAdminGuard><SuperAdminManagement /></SuperAdminGuard></AuthenticatedMaintenanceGuard>} />
          <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </MultiCompanyGuard>
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
