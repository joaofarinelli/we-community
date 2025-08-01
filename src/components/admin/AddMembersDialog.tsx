import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Users, Tag, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessGroupId: string;
}

export const AddMembersDialog = ({ open, onOpenChange, accessGroupId }: AddMembersDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data: users } = useCompanyUsers(searchTerm);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = () => {
    // TODO: Implement adding members to access group
    console.log('Adding members:', selectedUsers);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Dar acesso a</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Nome
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Acesso ao espaço
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Confirmação de presença em evento
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Adicionar filtro
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar membros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results count */}
        <div className="mb-4">
          <span className="text-sm font-medium">
            {selectedUsers.length > 0 ? `${selectedUsers.length} membro${selectedUsers.length > 1 ? 's' : ''}` : '1 membro'}
          </span>
        </div>

        {/* Users table */}
        <div className="flex-1 overflow-hidden">
          <div className="border rounded-lg h-full">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
              <div className="col-span-1"></div>
              <div className="col-span-4">NOME</div>
              <div className="col-span-3">FUNÇÃO</div>
              <div className="col-span-4">DATA DE ENTRADA</div>
            </div>

            {/* Table content */}
            <div className="overflow-y-auto h-[calc(100%-57px)]">
              {users?.map((user) => (
                <div key={user.user_id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedUsers.includes(user.user_id)}
                      onCheckedChange={() => handleUserToggle(user.user_id)}
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.user_id}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm">Administrador</span>
                  </div>
                  <div className="col-span-4 flex items-center">
                    <span className="text-sm text-muted-foreground">22 Jul 2025</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Anterior</Button>
            <Button variant="outline" size="sm">Próximo</Button>
            <span className="text-sm text-muted-foreground">
              Mostrando 1-1 de 1
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0}
            >
              Adicionar {selectedUsers.length} membro{selectedUsers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};