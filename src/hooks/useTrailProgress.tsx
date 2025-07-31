import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface TrailProgress {
  id: string;
  trail_id: string;
  stage_id: string;
  user_id: string;
  company_id: string;
  is_completed: boolean;
  completed_at?: string;
  coins_earned: number;
  badges_earned: string[];
  created_at: string;
  updated_at: string;
}

export const useTrailProgress = (trailId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-progress', trailId, userId || user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      let query = supabase
        .from('trail_progress')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('user_id', userId || user.id);

      if (trailId) query = query.eq('trail_id', trailId);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useCompleteTrailStage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ trailId, stageId }: { trailId: string; stageId: string }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Mark stage as completed
      const { data, error } = await supabase
        .from('trail_progress')
        .upsert({
          trail_id: trailId,
          stage_id: stageId,
          user_id: user.id,
          company_id: currentCompanyId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate trail progress
      console.log('Calling calculate_trail_progress for trail:', trailId);
      const { data: progressResult, error: progressError } = await supabase.rpc('calculate_trail_progress', {
        p_trail_id: trailId
      });

      console.log('Trail progress calculation result:', progressResult, progressError);
      
      if (progressError) {
        console.error('Error calculating trail progress:', progressError);
        throw progressError;
      }

      return data;
    },
    onSuccess: (_, { trailId }) => {
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
      queryClient.invalidateQueries({ queryKey: ['trails'] });
      queryClient.invalidateQueries({ queryKey: ['all-trails'] });
      toast.success('Etapa concluída com sucesso!');
      
      // Award badge based on completion
      // This would be handled by triggers or additional logic
    },
    onError: (error: any) => {
      toast.error('Erro ao concluir etapa: ' + error.message);
    },
  });
};

export const useTrailBadges = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-badges', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trail_badges')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('badge_type');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useUserTrailBadges = (userId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-trail-badges', currentCompanyId, userId || user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // First get user trail badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_trail_badges')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('user_id', userId || user.id)
        .order('earned_at', { ascending: false });

      if (userBadgesError) throw userBadgesError;
      if (!userBadges || userBadges.length === 0) return [];

      // Get badge details
      const badgeIds = userBadges.map(ub => ub.badge_id);
      const { data: badges, error: badgesError } = await supabase
        .from('trail_badges')
        .select('*')
        .in('id', badgeIds);

      if (badgesError) throw badgesError;

      // Get trail details
      const trailIds = userBadges.map(ub => ub.trail_id);
      const { data: trails, error: trailsError } = await supabase
        .from('trails')
        .select('id, name')
        .in('id', trailIds);

      if (trailsError) throw trailsError;

      // Combine the data
      return userBadges.map(userBadge => ({
        ...userBadge,
        trail_badges: badges?.find(b => b.id === userBadge.badge_id) || {
          name: '',
          description: '',
          icon_name: 'Award',
          color: '#000000',
          badge_type: '',
          coins_reward: 0
        },
        trails: trails?.find(t => t.id === userBadge.trail_id) || { name: 'Trilha não encontrada' }
      }));
    },
    enabled: !!user && !!currentCompanyId,
  });
};