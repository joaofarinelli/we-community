import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { AccessGroup } from '@/hooks/useAccessGroups';

interface AccessGroupAccessTabProps {
  accessGroup: AccessGroup;
}

export const AccessGroupAccessTab = ({ accessGroup }: AccessGroupAccessTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">Acesso</h3>
        <p className="text-sm text-muted-foreground">
          Escolha os grupos de espaços e os espaços que farão parte deste grupo de acesso
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 h-[400px]">
        {/* Left Column - No Access */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <span className="font-medium text-sm">SEM ACESSO</span>
            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
              Adicionar todos
            </Button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Spaces</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs">👥</span>
                    teste
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Access */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b bg-primary/10">
            <span className="font-medium text-sm">ACESSO</span>
            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
              Remover todos
            </Button>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum acesso configurado
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="bg-primary text-primary-foreground">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};