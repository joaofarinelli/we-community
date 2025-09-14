import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { UserImportExportDialog } from '@/components/admin/UserImportExportDialog';
import { InvitesManagement } from '@/components/admin/InvitesManagement';
import { AdminUsersFilters } from '@/components/admin/users/AdminUsersFilters';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { useCompanyUsersWithFilters, UserFilters, FilteredUser } from '@/hooks/useCompanyUsersWithFilters';
import { useTags } from '@/hooks/useTags';
import { useCourses } from '@/hooks/useCourses';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { useManageUserStatus } from '@/hooks/useManageUserStatus';
import { BulkActionsButton } from '@/components/admin/BulkActionsButton';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Mail, 
  FileSpreadsheet
} from 'lucide-react';

export const AdminUsersPage = () => {
  const [editingMember, setEditingMember] = useState<FilteredUser | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: members, isLoading } = useCompanyUsersWithFilters(filters);
  const { data: tags = [] } = useTags();
  const { data: courses = [] } = useCourses();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();
  const { toggleUserStatus } = useManageUserStatus();

  // Update filters when individual filter states change
  useMemo(() => {
    const newFilters: UserFilters = {};
    
    if (filters.search) newFilters.search = filters.search;
    if (selectedRoles.length > 0) newFilters.roles = selectedRoles;
    if (selectedTags.length > 0) newFilters.tagIds = selectedTags;
    if (selectedCourses.length > 0) newFilters.courseIds = selectedCourses;
    if (selectedLevels.length > 0) newFilters.levelIds = selectedLevels;
    if (selectedBadges.length > 0) newFilters.badgeIds = selectedBadges;
    if (dateRange?.from) newFilters.joinedStart = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to) newFilters.joinedEnd = format(dateRange.to, 'yyyy-MM-dd');
    
    setFilters(newFilters);
  }, [filters.search, selectedRoles, selectedTags, selectedCourses, selectedLevels, selectedBadges, dateRange]);

  const handleEditMember = (member: FilteredUser) => {
    setEditingMember(member);
  };

  const handleToggleUserStatus = (member: FilteredUser) => {
    // Note: FilteredUser doesn't have is_active, so we'll assume active for now
    // This would need to be adjusted based on your actual data structure
    toggleUserStatus.mutate({ 
      userId: member.user_id, 
      isActive: false // You might need to fetch this separately or include in the RPC
    });
  };

  const handleDeleteMember = (memberId: string) => {
    // TODO: Implementar exclusão de membro
    console.log('Delete member:', memberId);
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedRoles([]);
    setSelectedTags([]);
    setSelectedCourses([]);
    setSelectedLevels([]);
    setSelectedBadges([]);
    setDateRange(undefined);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 space-y-4">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <div className="flex-1 mt-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gerenciar Audiência</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Gerencie todos os usuários da sua comunidade ({members?.length || 0} usuários)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BulkActionsButton filters={filters} disabled={!members || members.length === 0} />
              <UserImportExportDialog>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Importar/Exportar</span>
                  <span className="sm:hidden">Import</span>
                </Button>
              </UserImportExportDialog>
              <InviteUserDialog />
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="members" className="flex flex-col h-full">
            <div className="flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Membros</span>
                </TabsTrigger>
                <TabsTrigger value="invites" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Convites</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 mt-4 min-h-0">
              <TabsContent value="members" className="flex flex-col h-full space-y-4 mt-0">
                {/* Filters Section */}
                <div className="flex-shrink-0">
                  <AdminUsersFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    selectedRoles={selectedRoles}
                    selectedTags={selectedTags}
                    selectedCourses={selectedCourses}
                    selectedLevels={selectedLevels}
                    selectedBadges={selectedBadges}
                    dateRange={dateRange}
                    onSelectedRolesChange={setSelectedRoles}
                    onSelectedTagsChange={setSelectedTags}
                    onSelectedCoursesChange={setSelectedCourses}
                    onSelectedLevelsChange={setSelectedLevels}
                    onSelectedBadgesChange={setSelectedBadges}
                    onDateRangeChange={setDateRange}
                    tags={tags}
                    courses={courses}
                    levels={levels}
                    badges={badges}
                    onClearFilters={clearFilters}
                  />
                </div>

                {/* Users Table/Cards - Scrollable */}
                <div className="flex-1 min-h-0">
                  {!members || members.length === 0 ? (
                    <Card className="flex-1">
                      <CardHeader className="text-center py-12">
                        <CardTitle className="text-xl text-foreground">Nenhuma audiência ainda</CardTitle>
                        <CardDescription className="max-w-md mx-auto">
                          Você ainda não adicionou nenhuma pessoa. Comece a construir sua audiência convidando membros para sua comunidade ou importando contatos.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center pb-12">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <InviteUserDialog />
                          <UserImportExportDialog>
                            <Button variant="outline">
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Importar usuários
                            </Button>
                          </UserImportExportDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <AdminUsersTable
                      members={members}
                      onEditMember={handleEditMember}
                      onToggleUserStatus={handleToggleUserStatus}
                      onDeleteMember={handleDeleteMember}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="invites" className="flex flex-col h-full mt-0">
                <div className="flex-1 min-h-0">
                  <InvitesManagement />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <UserEditDialog
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember as any}
        />
      </div>
    </AdminLayout>
  );
};