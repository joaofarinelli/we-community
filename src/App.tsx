import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompanyProvider } from "@/hooks/useCompanyContext";
import { CrossDomainAuthProvider } from "@/hooks/useCrossDomainAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { MultiCompanyGuard } from "@/components/MultiCompanyGuard";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { RankingPage } from "./pages/RankingPage";
import { SpaceView } from "./pages/SpaceView";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminLevelsPage } from "./pages/admin/AdminLevelsPage";
import { AdminAccessGroupsPage } from "./pages/admin/AdminAccessGroupsPage";
import { AdminSegmentsPage } from "./pages/admin/AdminSegmentsPage";
import { AdminTagsPage } from "./pages/admin/AdminTagsPage";
import { AdminUserEditPage } from "./pages/admin/AdminUserEditPage";
import { CoursesPage } from "./pages/CoursesPage";
import { InviteAcceptPage } from "./pages/InviteAcceptPage";

import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { LessonPlayerPage } from "./pages/LessonPlayerPage";
import { AdminCoursesPage } from "./pages/admin/AdminCoursesPage";
import { AdminCourseModulesPage } from "./pages/admin/AdminCourseModulesPage";
import { AdminModuleLessonsPage } from "./pages/admin/AdminModuleLessonsPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { MarketplacePurchasesPage } from "./pages/MarketplacePurchasesPage";
import { AdminMarketplacePage } from "./pages/admin/AdminMarketplacePage";
import MyItemsPage from "./pages/MyItemsPage";
import { MembersPage } from "./pages/MembersPage";
import { AdminChallengesPage } from "./pages/admin/AdminChallengesPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { BankPage } from "./pages/BankPage";
import { CalendarPage } from "./pages/CalendarPage";
import { SpacesPage } from "./pages/SpacesPage";
import { SuperAdminGuard } from "@/components/super-admin/SuperAdminGuard";
import { SuperAdminDashboard } from "./pages/super-admin/SuperAdminDashboard";
import { SuperAdminCompanies } from "./pages/super-admin/SuperAdminCompanies";
import { SuperAdminReports } from "./pages/super-admin/SuperAdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <MultiCompanyGuard>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/dashboard/ranking" element={<AuthGuard><RankingPage /></AuthGuard>} />
        <Route path="/dashboard/members" element={<AuthGuard><MembersPage /></AuthGuard>} />
        <Route path="/dashboard/space/:spaceId" element={<AuthGuard><SpaceView /></AuthGuard>} />
        <Route path="/admin/users" element={<AuthGuard><AdminUsersPage /></AuthGuard>} />
        <Route path="/admin/settings" element={<AuthGuard><AdminSettingsPage /></AuthGuard>} />
        <Route path="/admin/levels" element={<AuthGuard><AdminLevelsPage /></AuthGuard>} />
        <Route path="/admin/access-groups" element={<AuthGuard><AdminAccessGroupsPage /></AuthGuard>} />
        <Route path="/admin/segments" element={<AuthGuard><AdminSegmentsPage /></AuthGuard>} />
        <Route path="/admin/tags" element={<AuthGuard><AdminTagsPage /></AuthGuard>} />
        <Route path="/admin/users/:userId/edit" element={<AuthGuard><AdminUserEditPage /></AuthGuard>} />
        <Route path="/courses" element={<AuthGuard><CoursesPage /></AuthGuard>} />
        <Route path="/dashboard/courses" element={<AuthGuard><CoursesPage /></AuthGuard>} />
        
        <Route path="/courses/:courseId/modules/:moduleId" element={<AuthGuard><ModuleDetailPage /></AuthGuard>} />
        <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AuthGuard><LessonPlayerPage /></AuthGuard>} />
        <Route path="/admin/courses" element={<AuthGuard><AdminCoursesPage /></AuthGuard>} />
        <Route path="/admin/courses/:courseId/modules" element={<AuthGuard><AdminCourseModulesPage /></AuthGuard>} />
        <Route path="/admin/courses/:courseId/modules/:moduleId/lessons" element={<AuthGuard><AdminModuleLessonsPage /></AuthGuard>} />
        <Route path="/dashboard/marketplace" element={<AuthGuard><MarketplacePage /></AuthGuard>} />
        <Route path="/dashboard/marketplace/purchases" element={<AuthGuard><MarketplacePurchasesPage /></AuthGuard>} />
        <Route path="/my-items" element={<AuthGuard><MyItemsPage /></AuthGuard>} />
        <Route path="/admin/marketplace" element={<AuthGuard><AdminMarketplacePage /></AuthGuard>} />
        <Route path="/admin/challenges" element={<AuthGuard><AdminChallengesPage /></AuthGuard>} />
        <Route path="/dashboard/challenges" element={<AuthGuard><ChallengesPage /></AuthGuard>} />
        <Route path="/dashboard/bank" element={<AuthGuard><BankPage /></AuthGuard>} />
        <Route path="/dashboard/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
        <Route path="/dashboard/spaces" element={<AuthGuard><SpacesPage /></AuthGuard>} />
        <Route path="/super-admin" element={<AuthGuard><SuperAdminGuard><SuperAdminDashboard /></SuperAdminGuard></AuthGuard>} />
        <Route path="/super-admin/companies" element={<AuthGuard><SuperAdminGuard><SuperAdminCompanies /></SuperAdminGuard></AuthGuard>} />
        <Route path="/super-admin/reports" element={<AuthGuard><SuperAdminGuard><SuperAdminReports /></SuperAdminGuard></AuthGuard>} />
        <Route path="/invite/accept/:token" element={<InviteAcceptPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MultiCompanyGuard>
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
