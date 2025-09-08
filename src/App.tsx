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
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { LessonPlayerPage } from "./pages/LessonPlayerPage";
import { AdminCoursesPage } from "./pages/admin/AdminCoursesPage";
import { AdminCourseModulesPage } from "./pages/admin/AdminCourseModulesPage";
import { AdminModuleLessonsPage } from "./pages/admin/AdminModuleLessonsPage";
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
import NotFound from "./pages/NotFound";
import { FaviconApplier } from '@/components/FaviconApplier';
import { OnboardingChecker } from '@/components/onboarding/OnboardingChecker';
import { AnnouncementProvider } from '@/components/ui/AnnouncementProvider';

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
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/dashboard/ranking" element={<AuthGuard><RankingPage /></AuthGuard>} />
          <Route path="/dashboard/members" element={<AuthGuard><MembersPage /></AuthGuard>} />
          <Route path="/dashboard/space/:spaceId" element={<AuthGuard><SpaceView /></AuthGuard>} />
          <Route path="/dashboard/space/:spaceId/post/:postId" element={<AuthGuard><PostDetailPage /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard><AdminUsersPage /></AuthGuard>} />
          <Route path="/admin/users/:userId" element={<AuthGuard><AdminUserViewPage /></AuthGuard>} />
          <Route path="/admin/settings" element={<AuthGuard><AdminSettingsPage /></AuthGuard>} />
          <Route path="/admin/levels" element={<AuthGuard><AdminLevelsPage /></AuthGuard>} />
          <Route path="/admin/access-groups" element={<AuthGuard><AdminAccessGroupsPage /></AuthGuard>} />
          <Route path="/admin/spaces" element={<AuthGuard><AdminSpacesPage /></AuthGuard>} />
          <Route path="/admin/segments" element={<AuthGuard><AdminSegmentsPage /></AuthGuard>} />
          <Route path="/admin/tags" element={<AuthGuard><AdminTagsPage /></AuthGuard>} />
          <Route path="/admin/profile-fields" element={<AuthGuard><AdminProfileFieldsPage /></AuthGuard>} />
          <Route path="/admin/onboarding" element={<AuthGuard><AdminOnboardingPage /></AuthGuard>} />
          <Route path="/admin/users/:userId/edit" element={<AuthGuard><AdminUserEditPage /></AuthGuard>} />
          <Route path="/courses" element={<AuthGuard><CoursesPage /></AuthGuard>} />
          <Route path="/dashboard/courses" element={<AuthGuard><CoursesPage /></AuthGuard>} />
          
          <Route path="/courses/:courseId/modules/:moduleId" element={<AuthGuard><ModuleDetailPage /></AuthGuard>} />
          <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AuthGuard><LessonPlayerPage /></AuthGuard>} />
          <Route path="/admin/courses" element={<AuthGuard><AdminCoursesPage /></AuthGuard>} />
          <Route path="/admin/courses/:courseId/modules" element={<AuthGuard><AdminCourseModulesPage /></AuthGuard>} />
          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons" element={<AuthGuard><AdminModuleLessonsPage /></AuthGuard>} />
          <Route path="/dashboard/marketplace" element={<AuthGuard><MarketplacePage /></AuthGuard>} />
          <Route path="/dashboard/store" element={<AuthGuard><StorePage /></AuthGuard>} />
          <Route path="/dashboard/marketplace/purchases" element={<AuthGuard><MarketplacePurchasesPage /></AuthGuard>} />
          <Route path="/my-items" element={<AuthGuard><MyItemsPage /></AuthGuard>} />
          <Route path="/admin/marketplace" element={<AuthGuard><AdminMarketplacePage /></AuthGuard>} />
          <Route path="/admin/marketplace/moderation" element={<AuthGuard><AdminMarketplaceModerationPage /></AuthGuard>} />
          <Route path="/admin/marketplace/terms" element={<AuthGuard><AdminMarketplaceTermsPage /></AuthGuard>} />
          <Route path="/admin/store" element={<AuthGuard><AdminStorePage /></AuthGuard>} />
          <Route path="/admin/store/categories" element={<AuthGuard><AdminStoreCategoriesPage /></AuthGuard>} />
          <Route path="/admin/challenges" element={<AuthGuard><AdminChallengesPage /></AuthGuard>} />
          <Route path="/admin/challenges/submissions" element={<AuthGuard><AdminChallengeSubmissionsPage /></AuthGuard>} />
          <Route path="/admin/challenge-submissions" element={<AuthGuard><AdminChallengeSubmissionsPage /></AuthGuard>} />
          <Route path="/dashboard/challenges" element={<AuthGuard><ChallengesPage /></AuthGuard>} />
          <Route path="/dashboard/bank" element={<AuthGuard><BankPage /></AuthGuard>} />
          <Route path="/dashboard/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
          <Route path="/dashboard/spaces" element={<AuthGuard><SpacesPage /></AuthGuard>} />
          <Route path="/dashboard/events/:eventId" element={<AuthGuard><EventDetailPage /></AuthGuard>} />
          <Route path="/dashboard/trails" element={<AuthGuard><TrailsPage /></AuthGuard>} />
          <Route path="/dashboard/trails/:trailId/stages" element={<AuthGuard><TrailStagesPage /></AuthGuard>} />
          <Route path="/dashboard/trails/:trailId/stage/:stageId" element={<AuthGuard><TrailStagePlayerPage /></AuthGuard>} />
          <Route path="/dashboard/certificates" element={<AuthGuard><CertificatesPage /></AuthGuard>} />
          <Route path="/dashboard/liked-lessons" element={<AuthGuard><LikedLessonsPage /></AuthGuard>} />
          <Route path="/dashboard/lesson-notes" element={<AuthGuard><LessonNotesPage /></AuthGuard>} />
          <Route path="/admin/trails" element={<AuthGuard><AdminTrailsPage /></AuthGuard>} />
          <Route path="/admin/trail-badges" element={<AuthGuard><AdminTrailBadgesPage /></AuthGuard>} />
          <Route path="/admin/content/posts" element={<AuthGuard><AdminContentPostsPage /></AuthGuard>} />
          <Route path="/admin/content/categories" element={<AuthGuard><AdminContentCategoriesPage /></AuthGuard>} />
          <Route path="/admin/content/spaces" element={<AuthGuard><AdminContentSpacesPage /></AuthGuard>} />
          <Route path="/admin/content/moderation" element={<AuthGuard><AdminContentModerationPage /></AuthGuard>} />
          <Route path="/admin/bulk-actions" element={<AuthGuard><AdminBulkActionsPage /></AuthGuard>} />
          <Route path="/admin/bulk-actions/create" element={<AuthGuard><BulkActionCreateEditPage /></AuthGuard>} />
          <Route path="/admin/bulk-actions/:id/edit" element={<AuthGuard><BulkActionCreateEditPage /></AuthGuard>} />
          <Route path="/admin/bulk-actions/:id/executions" element={<AuthGuard><BulkActionExecutionsPage /></AuthGuard>} />
          <Route path="/admin/analytics" element={<AuthGuard><AdminAnalyticsPage /></AuthGuard>} />
          <Route path="/super-admin" element={<AuthGuard><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></AuthGuard>} />
          <Route path="/super-admin/companies" element={<AuthGuard><SuperAdminGuard><SuperAdminCompanies /></SuperAdminGuard></AuthGuard>} />
          <Route path="/super-admin/metrics" element={<AuthGuard><SuperAdminGuard><SuperAdminMetrics /></SuperAdminGuard></AuthGuard>} />
          <Route path="/super-admin/reports" element={<AuthGuard><SuperAdminGuard><SuperAdminReports /></SuperAdminGuard></AuthGuard>} />
          <Route path="/super-admin/management" element={<AuthGuard><SuperAdminGuard><SuperAdminManagement /></SuperAdminGuard></AuthGuard>} />
          <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />
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
