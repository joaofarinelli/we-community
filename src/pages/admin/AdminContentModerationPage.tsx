import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannedWordsManagement } from '@/components/admin/BannedWordsManagement';
import { ContentModerationDashboard } from '@/components/admin/ContentModerationDashboard';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useModerationReports } from '@/hooks/useModerationReports';

export const AdminContentModerationPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const { pendingCount } = useModerationReports();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Moderação de Conteúdo</h1>
          <p className="text-muted-foreground">
            Gerencie palavras proibidas e moderação automática de conteúdo.
          </p>
        </div>

        <Tabs defaultValue="moderation" className="space-y-4">
          <TabsList>
            <TabsTrigger value="moderation">
              Dashboard de Moderação
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="banned-words">
              Palavras Proibidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation">
            <ContentModerationDashboard />
          </TabsContent>

          <TabsContent value="banned-words">
            <BannedWordsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};