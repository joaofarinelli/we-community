import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { TipTapEditor } from './TipTapEditor';
import { EditorToolbar } from './EditorToolbar';
import { SpaceSelector } from './SpaceSelector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSpaceId?: string;
}

export const CreatePostDialog = ({ open, onOpenChange, initialSpaceId }: CreatePostDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState(initialSpaceId || '');
  
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user || !company || !selectedSpaceId) {
        throw new Error('Dados necessários não encontrados');
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          space_id: selectedSpaceId,
          company_id: company.id,
          author_id: user.id,
          title: title || null,
          content,
          type: 'text',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
      toast.success('Publicação criada com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Erro ao criar publicação:', error);
      toast.error('Erro ao criar publicação. Tente novamente.');
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  const handlePublish = () => {
    if (!content.trim() || !selectedSpaceId) {
      toast.error('Preencha o conteúdo e selecione um espaço');
      return;
    }
    createPost.mutate();
  };

  const isPublishDisabled = !content.trim() || !selectedSpaceId || createPost.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-background">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">Criar publicação</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Título opcional */}
          <div className="p-4 border-b border-border">
            <Input
              placeholder="Título (opcional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-transparent text-lg font-medium placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            />
          </div>

          {/* Editor de conteúdo */}
          <div className="flex-1 min-h-[300px]">
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Escreva algo..."
              className="min-h-[300px]"
            />
          </div>

          {/* Barra de ferramentas */}
          <EditorToolbar />

          {/* Footer com seletor de espaço e botão publicar */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <SpaceSelector
              selectedSpaceId={selectedSpaceId}
              onSpaceChange={setSelectedSpaceId}
            />
            
            <Button
              onClick={handlePublish}
              disabled={isPublishDisabled}
              className="min-w-[80px]"
            >
              {createPost.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};