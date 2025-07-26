import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LessonNote {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export const useLessonNotes = (lessonId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lesson-notes', lessonId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LessonNote[];
    },
    enabled: !!lessonId && !!user
  });
};

export const useCreateLessonNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ lessonId, content, timestampSeconds }: {
      lessonId: string;
      content: string;
      timestampSeconds?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content,
          timestamp_seconds: timestampSeconds
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', variables.lessonId, user?.id] });
      toast({
        title: "Anotação salva",
        description: "Sua anotação foi salva com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anotação.",
        variant: "destructive"
      });
    }
  });
};

export const useUpdateLessonNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ noteId, lessonId, content }: {
      noteId: string;
      lessonId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('lesson_notes')
        .update({ content })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', variables.lessonId, user?.id] });
      toast({
        title: "Anotação atualizada",
        description: "Sua anotação foi atualizada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a anotação.",
        variant: "destructive"
      });
    }
  });
};

export const useDeleteLessonNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ noteId, lessonId }: { noteId: string; lessonId: string }) => {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', variables.lessonId, user?.id] });
      toast({
        title: "Anotação removida",
        description: "Sua anotação foi removida com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a anotação.",
        variant: "destructive"
      });
    }
  });
};