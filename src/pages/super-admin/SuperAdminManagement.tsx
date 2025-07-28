import { useState } from "react";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuperAdmins, useAddSuperAdmin, useRemoveSuperAdmin } from "@/hooks/useSuperAdminManagement";
import { Plus, Trash2, Users, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SuperAdminManagement() {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [removingAdmin, setRemovingAdmin] = useState<{ id: string; email: string } | null>(null);

  const { data: superAdmins, isLoading, refetch } = useSuperAdmins();
  const addSuperAdminMutation = useAddSuperAdmin();
  const removeSuperAdminMutation = useRemoveSuperAdmin();

  // Enable the query on mount
  useState(() => {
    refetch();
  });

  const handleAddSuperAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    await addSuperAdminMutation.mutateAsync(newAdminEmail.trim());
    setNewAdminEmail("");
  };

  const handleRemoveSuperAdmin = async () => {
    if (!removingAdmin) return;
    
    await removeSuperAdminMutation.mutateAsync(removingAdmin.id);
    setRemovingAdmin(null);
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Super Admins</h1>
            <p className="text-muted-foreground">
              Adicione ou remova super administradores do sistema
            </p>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Super Admins</h1>
          <p className="text-muted-foreground">
            Adicione ou remova super administradores do sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Adicionar Super Admin
            </CardTitle>
            <CardDescription>
              Digite o email de um usuário existente para torná-lo super administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSuperAdmin()}
                />
              </div>
              <Button 
                onClick={handleAddSuperAdmin}
                disabled={!newAdminEmail.trim() || addSuperAdminMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Super Admins Ativos</h3>
                <Badge variant="outline">
                  {superAdmins?.length || 0} administradores
                </Badge>
              </div>

              {!superAdmins || superAdmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum super admin encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Criado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {superAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {admin.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(admin.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRemovingAdmin({ id: admin.user_id, email: admin.email })}
                            disabled={removeSuperAdminMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={!!removingAdmin} onOpenChange={() => setRemovingAdmin(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Super Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja remover <strong>{removingAdmin?.email}</strong> como super administrador?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveSuperAdmin}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
}