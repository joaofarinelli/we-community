import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { TipTapEditor, TipTapEditorRef } from './TipTapEditor';
import { EditorToolbar } from './EditorToolbar';
import { EditorEmojiPicker } from './EditorEmojiPicker';
import { ImageUploadButton } from './ImageUploadButton';
import { DocumentUploadButton } from './DocumentUploadButton';
import { SpaceSelector } from './SpaceSelector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { toast } from 'sonner';
interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialSpaceId?: string;
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
}
export const PostDialog = ({
  open,
  onOpenChange,
  mode,
  initialSpaceId,
  postId,
  initialTitle,
  initialContent
}: PostDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState(initialSpaceId || '');
  const editorRef = useRef<TipTapEditorRef>(null);
  const {
    user
  } = useAuth();
  const {
    data: company
  } = useCompany();
  const queryClient = useQueryClient();
  const {
    mutate: updatePost,
    isPending: isUpdating
  } = useUpdatePost();

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit') {
        setTitle(initialTitle || '');
        setContent(initialContent || '');
        setSelectedSpaceId(''); // Space selector not needed for edit
      } else {
        setTitle('');
        setContent('');
        setSelectedSpaceId(initialSpaceId || '');
      }
    }
  }, [open, mode, initialTitle, initialContent, initialSpaceId]);
  const createPost = useMutation({
    mutationFn: async () => {
      if (!user || !company || !selectedSpaceId) {
        throw new Error('Dados necessários não encontrados');
      }
      const {
        error
      } = await supabase.from('posts').insert({
        space_id: selectedSpaceId,
        company_id: company.id,
        author_id: user.id,
        title: title || null,
        content,
        type: 'text'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['spacePosts']
      });
      toast.success('Publicação criada com sucesso!');
      resetForm();
      onOpenChange(false);
    },
    onError: error => {
      console.error('Erro ao criar publicação:', error);
      toast.error('Erro ao criar publicação. Tente novamente.');
    }
  });
  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedSpaceId(initialSpaceId || '');
  };
  const handleEmojiSelect = (emoji: string) => {
    editorRef.current?.insertEmoji(emoji);
  };
  const handleImageUpload = (url: string) => {
    editorRef.current?.insertImage(url);
  };
  const handleDocumentUpload = (url: string, name: string) => {
    editorRef.current?.insertDocument(url, name);
  };
  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('O conteúdo é obrigatório');
      return;
    }
    if (mode === 'create') {
      if (!selectedSpaceId) {
        toast.error('Selecione um espaço');
        return;
      }
      createPost.mutate();
    } else {
      if (!postId) {
        toast.error('ID do post não encontrado');
        return;
      }
      updatePost({
        postId,
        data: {
          title: title || undefined,
          content
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
        }
      });
    }
  };
  const isSubmitDisabled = !content.trim() || mode === 'create' && (!selectedSpaceId || createPost.isPending) || mode === 'edit' && isUpdating;
  const submitButtonText = () => {
    if (mode === 'create') {
      return createPost.isPending ? 'Publicando...' : 'Publicar';
    } else {
      return isUpdating ? 'Salvando...' : 'Salvar alterações';
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-background overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <DialogTitle className="font-semibold text-2xl">
            {mode === 'create' ? 'Criar publicação' : 'Editar publicação'}
          </DialogTitle>
          
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Título opcional */}
          <div className="px-4 pt-4 pb-4 border-b border-border">
            <Input placeholder="Título (opcional)" value={title} onChange={e => setTitle(e.target.value)} className="border-none bg-transparent font-medium placeholder:text-muted-foreground p-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" style={{
            fontSize: '24px'
          }} />
          </div>

          {/* Editor de conteúdo */}
          <div className="flex-1 min-h-[300px] overflow-y-auto">
            <TipTapEditor ref={editorRef} content={content} onChange={setContent} placeholder="Escreva algo..." className="min-h-[300px]" />
          </div>

          {/* Barra de ferramentas com emoji picker, upload de imagem e documento */}
          <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-1">
              <DocumentUploadButton onDocumentUpload={handleDocumentUpload} />
              <ImageUploadButton onImageUpload={handleImageUpload} />
              <EditorEmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            {mode === 'create' ? <SpaceSelector selectedSpaceId={selectedSpaceId} onSpaceChange={setSelectedSpaceId} /> : <div /> // Spacer para manter o botão à direita
          }
            
            <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="min-w-[120px]">
              {submitButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};