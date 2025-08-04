import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import { useUserInvites } from "@/hooks/useUserInvites";
import { useManageInvites } from "@/hooks/useManageInvites";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RotateCcw, X } from "lucide-react";

export const InvitesManagement = () => {
  const { data: invites, isLoading } = useUserInvites();
  const { revokeInvite, resendInvite, isRevoking, isResending } = useManageInvites();

  if (isLoading) {
    return <div>Carregando convites...</div>;
  }

  if (!invites || invites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum convite encontrado.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default">Aceito</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Convites Enviados</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enviado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium">{invite.email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {invite.role === 'admin' ? 'Administrador' : 'Membro'}
                </Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(invite.status, invite.expires_at)}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(invite.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(invite.expires_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  {invite.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvite(invite.id)}
                        disabled={isResending}
                        title="Reenviar convite"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Revogar convite"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar Convite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja revogar o convite para "{invite.email}"? 
                              Esta ação não pode ser desfeita e o usuário não poderá mais usar este convite.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => revokeInvite(invite.id)}
                              disabled={isRevoking}
                            >
                              {isRevoking ? 'Revogando...' : 'Revogar Convite'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};