import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface CreatePostFormProps {
  spaceId: string;
}

export const CreatePostForm = ({ spaceId }: CreatePostFormProps) => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const createPost = useMutation({
    mutationFn: async () => {
      if (!user || !company) throw new Error('User or company not found');
      if (!content.trim()) throw new Error('Content is required');

      const { error } = await supabase
        .from('posts')
        .insert({
          space_id: spaceId,
          company_id: company.id,
          author_id: user.id,
          title: title.trim() || null,
          content: content.trim(),
          type: 'text',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spacePosts', spaceId] });
      setTitle('');
      setContent('');
      setIsExpanded(false);
      toast.success('Post criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar post');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                U
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Compartilhe algo com o time..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="min-h-[60px] resize-none border-none shadow-none focus-visible:ring-0 p-0"
              />
              
              {isExpanded && (
                <>
                  <Input
                    placeholder="Título (opcional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 p-0 font-medium"
                  />
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      {/* Futuros botões para anexos, emojis, etc. */}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsExpanded(false);
                          setTitle('');
                          setContent('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!content.trim() || createPost.isPending}
                      >
                        {createPost.isPending ? 'Publicando...' : 'Publicar'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};