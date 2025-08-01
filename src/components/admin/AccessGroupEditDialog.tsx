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
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>
      <DialogContent className="w-full h-[95vh] max-w-none p-0 gap-0 top-[5vh] translate-y-0 border-0 border-t sm:rounded-none data-[state=open]:animate-[slide-in-from-bottom_0.3s_ease-out] data-[state=closed]:animate-[slide-out-to-bottom_0.3s_ease-out]">
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