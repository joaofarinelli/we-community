import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LessonMaterial {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export const useLessonMaterials = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LessonMaterial[];
    },
    enabled: !!lessonId
  });
};

export const useCreateLessonMaterial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ lessonId, title, fileUrl, fileType, fileSize }: {
      lessonId: string;
      title: string;
      fileUrl: string;
      fileType?: string;
      fileSize?: number;
    }) => {
      const { data, error } = await supabase
        .from('lesson_materials')
        .insert({
          lesson_id: lessonId,
          title,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', variables.lessonId] });
      toast({
        title: "Material adicionado",
        description: "O material foi adicionado com sucesso à aula."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o material.",
        variant: "destructive"
      });
    }
  });
};

export const useDeleteLessonMaterial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ materialId, lessonId }: { materialId: string; lessonId: string }) => {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', variables.lessonId] });
      toast({
        title: "Material removido",
        description: "O material foi removido com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o material.",
        variant: "destructive"
      });
    }
  });
};