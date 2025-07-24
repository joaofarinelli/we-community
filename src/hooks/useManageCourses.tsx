import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';

export const useCreateCourse = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: {
      title: string;
      description?: string;
      thumbnail_url?: string;
      order_index?: number;
    }) => {
      if (!user?.id || !company?.id) throw new Error('User or company not found');

      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...course,
          company_id: company.id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar curso');
      console.error('Error creating course:', error);
    }
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      description?: string;
      thumbnail_url?: string;
      is_active?: boolean;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar curso');
      console.error('Error updating course:', error);
    }
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir curso');
      console.error('Error deleting course:', error);
    }
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: {
      course_id: string;
      title: string;
      description?: string;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('course_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar módulo');
      console.error('Error creating module:', error);
    }
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, course_id, ...updates }: {
      id: string;
      course_id: string;
      title?: string;
      description?: string;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar módulo');
      console.error('Error updating module:', error);
    }
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, course_id }: { id: string; course_id: string }) => {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.course_id] });
      toast.success('Módulo excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir módulo');
      console.error('Error deleting module:', error);
    }
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: {
      module_id: string;
      title: string;
      description?: string;
      content?: string;
      video_url?: string;
      duration?: number;
      order_index?: number;
      difficulty_level?: string;
    }) => {
      const { data, error } = await supabase
        .from('course_lessons')
        .insert(lesson)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', variables.module_id] });
      toast.success('Aula criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar aula');
      console.error('Error creating lesson:', error);
    }
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, module_id, ...updates }: {
      id: string;
      module_id: string;
      title?: string;
      description?: string;
      content?: string;
      video_url?: string;
      duration?: number;
      order_index?: number;
      difficulty_level?: string;
    }) => {
      const { data, error } = await supabase
        .from('course_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', variables.module_id] });
      toast.success('Aula atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar aula');
      console.error('Error updating lesson:', error);
    }
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, module_id }: { id: string; module_id: string }) => {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', variables.module_id] });
      toast.success('Aula excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir aula');
      console.error('Error deleting lesson:', error);
    }
  });
};