import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AccessGroup } from '@/hooks/useAccessGroups';
import { Card, CardContent } from '@/components/ui/card';
import { AddMembersDialog } from './AddMembersDialog';
import { useAccessGroupMembers } from '@/hooks/useAccessGroupMembers';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users } from 'lucide-react';

interface AccessGroupMembersTabProps {
  accessGroup: AccessGroup;
}

export const AccessGroupMembersTab = ({ accessGroup }: AccessGroupMembersTabProps) => {
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const { members, isLoading, removeMember } = useAccessGroupMembers(accessGroup.id);

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro do grupo?')) {
      await removeMember.mutateAsync({ memberId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            Membros de {accessGroup.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Os membros deste grupo têm acesso a todos os espaços.
          </p>
        </div>
        <Button onClick={() => setShowAddMembersDialog(true)}>
          Adicionar membros
        </Button>
      </div>

{members.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {(member.user?.first_name || member.profiles?.first_name)?.charAt(0)}
                      {(member.user?.last_name || member.profiles?.last_name)?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {member.user?.first_name || member.profiles?.first_name} {member.user?.last_name || member.profiles?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.user?.email || member.profiles?.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">
                      {member.user?.role || member.profiles?.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">
                Configurar membros do grupo
              </h4>
              <p className="text-muted-foreground mb-6">
                Ao adicionar um membro a este grupo, ele receberá automaticamente acesso a todos os espaços na aba Acesso.
              </p>
              <Button 
                variant="outline"
                onClick={() => setShowAddMembersDialog(true)}
              >
                Selecionar membros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddMembersDialog
        open={showAddMembersDialog}
        onOpenChange={setShowAddMembersDialog}
        accessGroupId={accessGroup.id}
      />
    </div>
  );
};