import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AccessGroup } from '@/hooks/useAccessGroups';
import { Card, CardContent } from '@/components/ui/card';
import { AddMembersDialog } from './AddMembersDialog';

interface AccessGroupMembersTabProps {
  accessGroup: AccessGroup;
}

export const AccessGroupMembersTab = ({ accessGroup }: AccessGroupMembersTabProps) => {
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);

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

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
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

      <AddMembersDialog
        open={showAddMembersDialog}
        onOpenChange={setShowAddMembersDialog}
        accessGroupId={accessGroup.id}
      />
    </div>
  );
};