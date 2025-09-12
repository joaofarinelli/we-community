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
  cover_url?: string;
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

export const useAvailableTrails = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['available-trails', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Get all trails created by admins/owners that are available for users - select only needed fields
      const { data, error } = await supabase
        .from('trails')
        .select(`
          id,
          name,
          description,
          status,
          created_at,
          user_id,
          template_id
        `)
        .eq('company_id', currentCompanyId)
        .neq('user_id', user.id) // Exclude user's own trails
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
};

export const useUserTrailParticipations = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-trail-participations', currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Get trails where user is participating with template cover_url - select only needed fields
      const { data, error } = await supabase
        .from('trails')
        .select(`
          id,
          name,
          description,
          status,
          progress_percentage,
          created_at,
          updated_at,
          template_id,
          trail_templates (
            cover_url
          )
        `)
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include cover_url directly
      return data?.map(trail => ({
        ...trail,
        cover_url: (trail.trail_templates as any)?.cover_url
      })) || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
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
      user_id?: string; // For admin creating trails for users
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
      queryClient.invalidateQueries({ queryKey: ['available-trails'] });
      queryClient.invalidateQueries({ queryKey: ['user-trail-participations'] });
      toast.success('Trilha criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar trilha: ' + error.message);
    },
  });
};

export const useJoinTrail = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (trailData: {
      template_id: string; // ID of the trail template/original trail
      name: string;
      description?: string;
      life_area?: string;
    }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Check prerequisites before attempting to start trail
      const { data: eligibilityResult, error: eligibilityError } = await supabase
        .rpc('can_start_trail', {
          p_user_id: user.id,
          p_company_id: currentCompanyId,
          p_template_id: trailData.template_id
        });

      if (eligibilityError) {
        console.error('Error checking trail eligibility:', eligibilityError);
      } else if (!eligibilityResult) {
        // Get prerequisite details for error message
        const { data: template } = await supabase
          .from('trail_templates')
          .select('access_criteria')
          .eq('id', trailData.template_id)
          .single();
        
        const accessCriteria = template?.access_criteria || {};
        const requiredTemplateIds = (accessCriteria as any).required_trail_template_ids || [];
        
        if (requiredTemplateIds.length > 0) {
          const { data: prereqTemplates } = await supabase
            .from('trail_templates')
            .select('name')
            .in('id', requiredTemplateIds);
          
          const prerequisiteNames = prereqTemplates?.map(t => t.name).join(', ') || 'trilhas anteriores';
          throw new Error(`Para iniciar esta jornada, você precisa concluir primeiro: ${prerequisiteNames}`);
        }
      }

      // Ensure company context is set for multi-company users
      console.debug('useJoinTrail: setting context', {
        userId: user.id,
        companyId: currentCompanyId,
        templateId: trailData.template_id,
      });
      try {
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId,
        });
      } catch (e) {
        console.warn('useJoinTrail: set_current_company_context failed (continuing)', e);
      }

      // Pre-check to avoid duplicate start for same template/company/user
      const { data: existing } = await supabase
        .from('trails')
        .select('id, status, created_at')
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id)
        .eq('template_id', trailData.template_id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Already started in this company
        return { trail: existing, alreadyExisted: true } as const;
      }

      // Idempotent insert: if a race happens, upsert will update the existing row
      const { data, error } = await supabase
        .from('trails')
        .upsert(
          {
            ...trailData,
            company_id: currentCompanyId,
            user_id: user.id,
            created_by: user.id,
            status: 'active',
          },
          { onConflict: 'user_id,template_id,company_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return { trail: data, alreadyExisted: false } as const;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['trails'] });
      queryClient.invalidateQueries({ queryKey: ['user-trail-participations'] });
      if (result?.alreadyExisted) {
        toast.info('Você já iniciou esta trilha nesta empresa.');
      } else {
        toast.success('Você iniciou a trilha com sucesso!');
      }
    },
    onError: (error: any) => {
      const msg = String(error?.message || '');
      if (error?.code === '23505' || /duplicate key value|unique_user_trail_template/i.test(msg)) {
        toast.info('Você já iniciou esta trilha nesta empresa.');
        console.debug('useJoinTrail duplicate detected', {
          userId: user?.id,
          companyId: currentCompanyId,
        });
        return;
      }
      toast.error('Erro ao iniciar trilha: ' + msg);
      console.debug('useJoinTrail error context', {
        userId: user?.id,
        companyId: currentCompanyId,
      });
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