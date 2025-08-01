import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AccessGroup } from '@/hooks/useAccessGroups';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessGroupMembersTab } from './AccessGroupMembersTab';
import { AccessGroupAccessTab } from './AccessGroupAccessTab';

interface AccessGroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessGroup: AccessGroup | null;
}

export const AccessGroupEditDialog = ({ open, onOpenChange, accessGroup }: AccessGroupEditDialogProps) => {
  const [activeTab, setActiveTab] = useState('members');

  if (!accessGroup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{accessGroup.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {accessGroup.description || 'Nenhuma descrição fornecida'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent h-12">
            <TabsTrigger 
              value="members" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Membros
            </TabsTrigger>
            <TabsTrigger 
              value="access"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Acesso
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="members" className="h-full m-0 p-6">
              <AccessGroupMembersTab accessGroup={accessGroup} />
            </TabsContent>
            
            <TabsContent value="access" className="h-full m-0 p-6">
              <AccessGroupAccessTab accessGroup={accessGroup} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};