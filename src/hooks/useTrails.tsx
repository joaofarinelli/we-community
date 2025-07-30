import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface Trail {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  life_area?: string;
  template_id?: string;
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const useTrails = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trails', currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useAllTrails = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['all-trails', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Get trails first
      const { data: trails, error: trailsError } = await supabase
        .from('trails')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (trailsError) throw trailsError;
      if (!trails) return [];

      // Get profiles for these trails
      const userIds = trails.map(t => t.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      return trails.map(trail => ({
        ...trail,
        profiles: profiles?.find(p => p.user_id === trail.user_id) || null
      }));
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useCreateTrail = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (trailData: {
      name: string;
      description?: string;
      life_area?: string;
      template_id?: string;
      user_id?: string;
    }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trails')
        .insert({
          ...trailData,
          company_id: currentCompanyId,
          user_id: trailData.user_id || user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trails'] });
      queryClient.invalidateQueries({ queryKey: ['all-trails'] });
      toast.success('Trilha criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar trilha: ' + error.message);
    },
  });
};

export const useUpdateTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Trail>) => {
      const { data, error } = await supabase
        .from('trails')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trails'] });
      queryClient.invalidateQueries({ queryKey: ['all-trails'] });
      toast.success('Trilha atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar trilha: ' + error.message);
    },
  });
};

export const useDeleteTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trails')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trails'] });
      queryClient.invalidateQueries({ queryKey: ['all-trails'] });
      toast.success('Trilha excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir trilha: ' + error.message);
    },
  });
};