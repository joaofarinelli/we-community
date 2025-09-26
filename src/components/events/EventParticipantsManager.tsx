import { useState } from 'react';
import { Search, UserPlus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/dashboard/UserAvatar';
import { toast } from 'sonner';

interface EventParticipantsManagerProps {
  eventId: string;
  isAdmin?: boolean;
}

export const EventParticipantsManager = ({ eventId, isAdmin = false }: EventParticipantsManagerProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, removeParticipant, isJoining, isRemoving } = useEventParticipants(eventId);
  const { data: companyUsers = [] } = useCompanyUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredUsers = companyUsers.filter(companyUser => {
    const fullName = `${companyUser.first_name} ${companyUser.last_name}`.toLowerCase();
    const email = companyUser.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    // Filter out users who are already participants
    const isAlreadyParticipant = participants.some(p => p.user_id === companyUser.user_id);
    
    return !isAlreadyParticipant && (fullName.includes(search) || email.includes(search));
  });

  const handleAddParticipant = async (userId: string) => {
    try {
      await joinEvent.mutateAsync({
        eventId,
        paymentStatus: 'none',
      });
      toast.success('Participante adicionado com sucesso!');
      setAddDialogOpen(false);
      setSearchTerm('');
    } catch (error) {
      toast.error('Erro ao adicionar participante');
    }
  };

  const handleRemoveParticipant = async (userId: string, userName: string) => {
    if (!isAdmin && userId !== user?.id) {
      toast.error('Apenas administradores podem remover outros participantes');
      return;
    }

    if (confirm(`Tem certeza que deseja remover ${userName} do evento?`)) {
      try {
        await removeParticipant.mutateAsync(userId);
      } catch (error) {
        toast.error('Erro ao remover participante');
      }
    }
  };

  const getParticipantName = (participant: any) => {
    if (participant.profiles?.first_name && participant.profiles?.last_name) {
      return `${participant.profiles.first_name} ${participant.profiles.last_name}`;
    }
    return 'Usuário';
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending_coins':
      case 'pending_external':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Gratuito</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-medium">Participantes ({participants.length})</h3>
        </div>
        
        {isAdmin && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Participante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Participante</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já são participantes'}
                    </p>
                  ) : (
                    filteredUsers.map((companyUser) => (
                      <div
                        key={companyUser.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={`${companyUser.first_name} ${companyUser.last_name}`}
                            email={companyUser.email}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {companyUser.first_name} {companyUser.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {companyUser.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddParticipant(companyUser.user_id)}
                          disabled={isJoining}
                        >
                          {isJoining ? '...' : 'Adicionar'}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum participante ainda
            </p>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => {
                const participantName = getParticipantName(participant);
                const canRemove = isAdmin || participant.user_id === user?.id;
                
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={getParticipantName(participant)}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{participantName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {participant.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                          {getPaymentStatusBadge(participant.payment_status)}
                          {participant.user_id === user?.id && (
                            <Badge variant="secondary" className="text-xs">Você</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {canRemove && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveParticipant(participant.user_id, participantName)}
                        disabled={isRemoving}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};