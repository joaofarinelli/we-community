import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

type ChallengeType = 'course_completion' | 'post_creation' | 'marketplace_purchase' | 'custom_action' | 'points_accumulation' | 'custom_goal';
type RewardType = 'coins' | 'course_access' | 'file_download' | 'marketplace_item';

export const useManageChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['manage-challenges'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_progress(count),
          challenge_rewards(count)
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (challengeData: {
      title: string;
      description?: string;
      challenge_type: ChallengeType;
      requirements: Record<string, any>;
      reward_type: RewardType;
      reward_value: Record<string, any>;
      start_date?: string;
      end_date?: string;
      max_participants?: number;
      challenge_duration_days?: number;
      challenge_duration_hours?: number;
      deadline_type?: 'duration' | 'fixed_date';
      image_url?: string;
      is_available_for_all_levels?: boolean;
      required_level_id?: string;
      access_tags?: string[];
    }) => {
      if (!user?.id || !company?.id) throw new Error('User not authenticated or company not found');

      // Ensure Postgres session has the correct company context for RLS
      const { error: ctxError } = await supabase.rpc('set_current_company_context', {
        p_company_id: company.id,
      });
      if (ctxError) throw ctxError;

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          ...challengeData,
          created_by: user.id,
          company_id: company.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Desafio criado com sucesso!');
    },
    onError: (error) => {
      const msg = typeof (error as any)?.message === 'string' ? (error as any).message : String(error);
      if (msg.toLowerCase().includes('row-level security') || msg.includes('42501') || msg.toLowerCase().includes('permission denied')) {
        toast.error('Sem permissão. Verifique se você é owner da empresa atual e se o contexto da empresa está correto.');
      } else {
        toast.error('Erro ao criar desafio: ' + msg);
      }
    }
  });
};

export const useUpdateChallenge = () => {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<{
        title: string;
        description: string;
        challenge_type: ChallengeType;
        requirements: Record<string, any>;
        reward_type: RewardType;
        reward_value: Record<string, any>;
        is_active: boolean;
        start_date: string;
        end_date: string;
        max_participants: number;
        challenge_duration_days: number;
        challenge_duration_hours: number;
        deadline_type: 'duration' | 'fixed_date';
      }>
    }) => {
      if (company?.id) {
        const { error: ctxError } = await supabase.rpc('set_current_company_context', { p_company_id: company.id });
        if (ctxError) throw ctxError;
      }

      const { data, error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Desafio atualizado com sucesso!');
    },
    onError: (error) => {
      const msg = typeof (error as any)?.message === 'string' ? (error as any).message : String(error);
      if (msg.toLowerCase().includes('row-level security') || msg.includes('42501') || msg.toLowerCase().includes('permission denied')) {
        toast.error('Sem permissão. Verifique se você é owner da empresa atual e se o contexto da empresa está correto.');
      } else {
        toast.error('Erro ao atualizar desafio: ' + msg);
      }
    }
  });
};

export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      if (company?.id) {
        const { error: ctxError } = await supabase.rpc('set_current_company_context', { p_company_id: company.id });
        if (ctxError) throw ctxError;
      }

      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Desafio excluído com sucesso!');
    },
    onError: (error) => {
      const msg = typeof (error as any)?.message === 'string' ? (error as any).message : String(error);
      if (msg.toLowerCase().includes('row-level security') || msg.includes('42501') || msg.toLowerCase().includes('permission denied')) {
        toast.error('Sem permissão. Verifique se você é owner da empresa atual e se o contexto da empresa está correto.');
      } else {
        toast.error('Erro ao excluir desafio: ' + msg);
      }
    }
  });
};

export const useChallengeAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenge-analytics'],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          challenge_progress(
            id,
            is_completed,
            user_id
          )
        `);

      if (challengesError) throw challengesError;

      const analytics = challenges?.map(challenge => {
        const totalParticipants = challenge.challenge_progress?.length || 0;
        const completedCount = challenge.challenge_progress?.filter(p => p.is_completed).length || 0;
        const completionRate = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;

        return {
          id: challenge.id,
          title: challenge.title,
          totalParticipants,
          completedCount,
          completionRate: Math.round(completionRate * 100) / 100
        };
      });

      return analytics || [];
    },
    enabled: !!user?.id,
  });
};