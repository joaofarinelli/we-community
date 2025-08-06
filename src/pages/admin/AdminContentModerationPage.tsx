import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Flag, Eye, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminContentModerationPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Simulando dados de moderação já que não temos tabelas específicas para isso
  const mockReports = [
    {
      id: '1',
      type: 'post',
      content_title: 'Publicação reportada como spam',
      reporter: 'João Silva',
      reason: 'Spam',
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'comment',
      content_title: 'Comentário ofensivo',
      reporter: 'Maria Santos',
      reason: 'Conteúdo ofensivo',
      status: 'reviewed',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const filters = [
    { id: 'type', label: 'Tipo' },
    { id: 'status', label: 'Status' },
    { id: 'reason', label: 'Motivo' },
    { id: 'reporter', label: 'Denunciante' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'reviewed':
        return <Badge variant="default">Revisado</Badge>;
      case 'resolved':
        return <Badge variant="outline">Resolvido</Badge>;
      default:
        return <Badge variant="destructive">Rejeitado</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageSquare className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'user':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const pendingReports = mockReports.filter(report => report.status === 'pending');
  const reviewedReports = mockReports.filter(report => report.status === 'reviewed');
  const allReports = mockReports;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Moderação</h1>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {pendingReports.length} pendentes
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Todas
              <Badge variant="secondary" className="ml-1">
                {allReports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pendentes
              <Badge variant="secondary" className="ml-1">
                {pendingReports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2">
              Revisadas
              <Badge variant="secondary" className="ml-1">
                {reviewedReports.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2 mt-4">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter.id)}
                className="text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>

          <TabsContent value="all" className="mt-6">
            {allReports.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma denúncia encontrada</h2>
                <p className="text-muted-foreground">
                  Não há denúncias para revisar no momento.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Conteúdo</th>
                      <th className="text-left p-4 font-medium">Denunciante</th>
                      <th className="text-left p-4 font-medium">Motivo</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(report.type)}
                            <span className="capitalize">{report.type}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{report.content_title}</td>
                        <td className="p-4">{report.reporter}</td>
                        <td className="p-4">{report.reason}</td>
                        <td className="p-4">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingReports.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma denúncia pendente</h2>
                <p className="text-muted-foreground">
                  Todas as denúncias foram revisadas.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Conteúdo</th>
                      <th className="text-left p-4 font-medium">Denunciante</th>
                      <th className="text-left p-4 font-medium">Motivo</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(report.type)}
                            <span className="capitalize">{report.type}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{report.content_title}</td>
                        <td className="p-4">{report.reporter}</td>
                        <td className="p-4">{report.reason}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              Aprovar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="mt-6">
            {reviewedReports.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma denúncia revisada</h2>
                <p className="text-muted-foreground">
                  Não há denúncias revisadas ainda.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Conteúdo</th>
                      <th className="text-left p-4 font-medium">Denunciante</th>
                      <th className="text-left p-4 font-medium">Motivo</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(report.type)}
                            <span className="capitalize">{report.type}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium">{report.content_title}</td>
                        <td className="p-4">{report.reporter}</td>
                        <td className="p-4">{report.reason}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};