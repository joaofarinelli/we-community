import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

export interface AccessGroupCourse {
  id: string;
  access_group_id: string;
  course_id: string;
  company_id: string;
  added_by: string;
  added_at: string;
}

export const useAccessGroupCourses = (accessGroupId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['access-group-courses', accessGroupId, currentCompanyId],
    queryFn: async () => {
      if (!accessGroupId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('access_group_courses')
        .select('*')
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return (data as AccessGroupCourse[]) || [];
    },
    enabled: !!accessGroupId && !!currentCompanyId,
  });

  const updateCourses = useMutation({
    mutationFn: async ({ accessGroupId, courseIds }: { accessGroupId: string; courseIds: string[] }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // First, remove all existing courses for this group
      await supabase
        .from('access_group_courses')
        .delete()
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      // Then add the new courses
      if (courseIds.length > 0) {
        const coursesToAdd = courseIds.map(courseId => ({
          access_group_id: accessGroupId,
          course_id: courseId,
          company_id: currentCompanyId,
          added_by: user.id,
        }));

        const { data, error } = await supabase
          .from('access_group_courses')
          .insert(coursesToAdd)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-group-courses', variables.accessGroupId] });
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Acessos atualizados!",
        description: "Os acessos do grupo foram salvos com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating courses:', error);
      toast({
        title: "Erro ao salvar acessos",
        description: error.message || "Não foi possível salvar os acessos do grupo.",
        variant: "destructive",
      });
    },
  });

  return {
    courses: query.data || [],
    isLoading: query.isLoading,
    updateCourses,
  };
};