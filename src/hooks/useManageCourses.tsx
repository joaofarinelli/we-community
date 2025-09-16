import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { toast } from 'sonner';
import { setGlobalCompanyId } from '@/integrations/supabase/client';

export const useCreateCourse = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: {
      title: string;
      description?: string;
      order_index?: number;
      certificate_enabled?: boolean;
      linear_module_progression?: boolean;
      mentor_name?: string | null;
      mentor_role?: string | null;
      mentor_signature_url?: string | null;
      certificate_background_url?: string | null;
      certificate_footer_text?: string | null;
      access_criteria?: {
        tag_ids?: string[];
        level_ids?: string[];
        badge_ids?: string[];
        logic?: 'any' | 'all';
      };
    }) => {
      if (!user?.id || !currentCompanyId) throw new Error('Usuário ou empresa não encontrados');

      // Set global company ID for header injection before the operation
      setGlobalCompanyId(currentCompanyId);

      // Use secure RPC function that handles all validation and creation
      const { data, error } = await supabase.rpc('create_course_secure', {
        p_company_id: currentCompanyId,
        p_title: course.title,
        p_description: course.description || null,
        p_thumbnail_url: null,
        p_order_index: course.order_index || 0,
        p_certificate_enabled: course.certificate_enabled ?? false,
        p_linear_module_progression: course.linear_module_progression ?? false,
        p_mentor_name: course.mentor_name || null,
        p_mentor_role: course.mentor_role || null,
        p_mentor_signature_url: course.mentor_signature_url || null,
        p_certificate_background_url: course.certificate_background_url || null,
        p_certificate_footer_text: course.certificate_footer_text || null,
        p_access_criteria: course.access_criteria || {}
      });

      if (error) throw error;

      return {
        course: (data as any).course,
        affectedUsers: (data as any).affected_users || 0
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (result.affectedUsers > 0) {
        toast.success(`Curso criado com sucesso! Acesso concedido para ${result.affectedUsers} usuária(s).`);
      } else {
        toast.success('Curso criado com sucesso!');
      }
    },
    onError: (error: any) => {
      console.error('Error creating course:', error);
      
      // Handle RLS policy violation
      if (error?.code === '42501' || error?.message?.includes('new row violates row-level security policy')) {
        toast.error('Sem permissão — você precisa ser admin ou owner na empresa atual para criar cursos');
      } else {
        toast.error('Erro ao criar curso');
      }
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
      is_active?: boolean;
      order_index?: number;
      certificate_enabled?: boolean;
      linear_module_progression?: boolean;
      prerequisite_course_id?: string | null;
      mentor_name?: string | null;
      mentor_role?: string | null;
      mentor_signature_url?: string | null;
      certificate_background_url?: string | null;
      certificate_footer_text?: string | null;
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
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: {
      course_id: string;
      title: string;
      description?: string;
      order_index?: number;
    }) => {
      if (!currentCompanyId) throw new Error('Empresa não encontrada');
      
      // Definir explicitamente o contexto da empresa antes da operação
      await supabase.rpc('set_current_company_context', {
        p_company_id: currentCompanyId
      });

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
      linear_lesson_progression?: boolean;
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
  const { currentCompanyId } = useCompanyContext();
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
      if (!currentCompanyId) throw new Error('Empresa não encontrada');
      
      // Definir explicitamente o contexto da empresa antes da operação
      await supabase.rpc('set_current_company_context', {
        p_company_id: currentCompanyId
      });

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

// Hook for reapplying course access criteria
export const useReapplyCourseAccess = () => {
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      accessCriteria 
    }: {
      courseId: string;
      accessCriteria: {
        tag_ids?: string[];
        level_ids?: string[];
        badge_ids?: string[];
        logic?: 'any' | 'all';
      };
    }) => {
      if (!currentCompanyId) throw new Error('Company not found');

      const { data: affectedUsers } = await supabase.rpc('grant_course_access', {
        p_company_id: currentCompanyId,
        p_course_id: courseId,
        p_tag_ids: accessCriteria.tag_ids || null,
        p_level_ids: accessCriteria.level_ids || null,
        p_badge_ids: accessCriteria.badge_ids || null,
        p_logic: accessCriteria.logic || 'any'
      });

      return affectedUsers || 0;
    },
    onSuccess: (affectedUsers) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`Acesso reaplicado! ${affectedUsers} usuária(s) receberam acesso ao curso.`);
    },
    onError: (error) => {
      toast.error('Erro ao reaplicar acesso ao curso');
      console.error('Error reapplying course access:', error);
    }
  });
};