import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Megaphone, 
  GraduationCap, 
  Users, 
  Play, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useBulkActionsNew, type BulkAction } from '@/hooks/useBulkActionsNew';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const actionTypeConfig = {
  notification: {
    icon: Bell,
    label: 'Notificação',
    color: 'bg-blue-100 text-blue-800',
  },
  announcement: {
    icon: Megaphone,
    label: 'Anúncio',
    color: 'bg-orange-100 text-orange-800',
  },
  course_access: {
    icon: GraduationCap,
    label: 'Acesso ao Curso',
    color: 'bg-green-100 text-green-800',
  },
  space_access: {
    icon: Users,
    label: 'Acesso ao Espaço',
    color: 'bg-purple-100 text-purple-800',
  },
};

export function BulkActionsListPage() {
  const navigate = useNavigate();
  const { bulkActions, isLoading, deleteBulkAction, executeBulkAction } = useBulkActionsNew();

  const handleDelete = async (id: string) => {
    await deleteBulkAction.mutateAsync(id);
  };

  const handleExecute = async (id: string) => {
    await executeBulkAction.mutateAsync(id);
  };

  const ActionTypeIcon = ({ type }: { type: BulkAction['action_type'] }) => {
    const config = actionTypeConfig[type];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ações em Massa</h1>
            <p className="text-muted-foreground">
              Gerencie suas operações em massa para usuários da plataforma.
            </p>
          </div>
          <Button onClick={() => navigate('/admin/bulk-actions/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        </div>

        <div className="grid gap-6">
          {bulkActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma ação criada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando sua primeira ação em massa para automatizar processos.
                </p>
                <Button onClick={() => navigate('/admin/bulk-actions/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira ação
                </Button>
              </CardContent>
            </Card>
          ) : (
            bulkActions.map((action) => {
              const config = actionTypeConfig[action.action_type];
              const Icon = config.icon;

              return (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{action.name}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={action.is_active ? 'default' : 'secondary'}>
                          {action.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Criado em {format(new Date(action.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/bulk-actions/${action.id}/executions`)}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Histórico
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/bulk-actions/${action.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExecute(action.id)}
                          disabled={!action.is_active || executeBulkAction.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Executar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir ação em massa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá excluir permanentemente
                                a ação "{action.name}" e todo seu histórico de execuções.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(action.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}