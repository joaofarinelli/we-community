import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  company_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  replies?: EventComment[];
}

export const useEventComments = (eventId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['eventComments', eventId, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId || !eventId) return [];

      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          event_id,
          user_id,
          company_id,
          content,
          parent_comment_id,
          created_at,
          updated_at
        `)
        .eq('event_id', eventId)
        .eq('company_id', currentCompanyId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles separately
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies, error: repliesError } = await supabase
            .from('event_comments')
            .select(`
              id,
              event_id,
              user_id,
              company_id,
              content,
              parent_comment_id,
              created_at,
              updated_at
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;

          const repliesWithProfiles = (replies || []).map(reply => ({
            ...reply,
            profiles: profilesMap.get(reply.user_id) || null
          }));

          return {
            ...comment,
            profiles: profilesMap.get(comment.user_id) || null,
            replies: repliesWithProfiles
          };
        })
      );

      return commentsWithReplies;
    },
    enabled: !!user && !!currentCompanyId && !!eventId,
  });
};

export const useCreateEventComment = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, content, parentCommentId }: { 
      eventId: string; 
      content: string; 
      parentCommentId?: string;
    }) => {
      if (!user || !currentCompanyId) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_id: user.id,
          company_id: currentCompanyId,
          content,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventComments', variables.eventId] });
      toast.success('Comentário adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar comentário:', error);
      toast.error('Erro ao criar comentário. Tente novamente.');
    },
  });
};

export const useUpdateEventComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content, eventId }: { 
      commentId: string; 
      content: string; 
      eventId: string;
    }) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('event_comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventComments', variables.eventId] });
      toast.success('Comentário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar comentário:', error);
      toast.error('Erro ao atualizar comentário. Tente novamente.');
    },
  });
};

export const useDeleteEventComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, eventId }: { commentId: string; eventId: string }) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventComments', variables.eventId] });
      toast.success('Comentário removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar comentário:', error);
      toast.error('Erro ao deletar comentário. Tente novamente.');
    },
  });
};