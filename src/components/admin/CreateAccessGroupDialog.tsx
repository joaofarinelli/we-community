import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAccessGroups } from '@/hooks/useAccessGroups';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreateAccessGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAccessGroupDialog = ({ open, onOpenChange }: CreateAccessGroupDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createGroup } = useAccessGroups();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating access group:', error);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Criar um novo grupo de acesso
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Nome interno
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nome usado internamente para identificar o grupo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do grupo"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Descrição (opcional)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Descrição opcional para explicar o propósito do grupo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste grupo (opcional)"
              className="w-full min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createGroup.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createGroup.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createGroup.isPending ? 'Criando...' : 'Criar grupo de acesso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};