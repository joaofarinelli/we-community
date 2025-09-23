import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface TrailWithTemplate {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  template_id?: string;
  cover_url?: string;
}

export interface TrailBadgeData {
  id: string;
  trail_id: string;
  badge_id: string;
  earned_at: string;
  badge_name: string;
  badge_description: string;
  badge_icon_name: string;
  badge_color: string;
  badge_type: string;
  coins_reward: number;
  trail_name: string;
}

export interface TrailsStats {
  activeTrails: number;
  completedTrails: number;
  totalBadges: number;
  averageProgress: number;
}

// Optimized hook that fetches all trail dashboard data in parallel
export const useTrailsDashboardData = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  // User trails with cover_url - optimized single query
  const userTrailsQuery = useQuery({
    queryKey: ['user-trails-dashboard', currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

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
      
      return data?.map(trail => ({
        ...trail,
        cover_url: (trail.trail_templates as any)?.cover_url
      })) || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // User badges - optimized single query with JOINs
  const userBadgesQuery = useQuery({
    queryKey: ['user-trail-badges-optimized', currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('user_trail_badges')
        .select(`
          id,
          trail_id,
          badge_id,
          earned_at,
          trail_badges (
            name,
            description,
            icon_name,
            color,
            badge_type,
            coins_reward
          ),
          trails (
            name
          )
        `)
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return data?.map(userBadge => ({
        id: userBadge.id,
        trail_id: userBadge.trail_id,
        badge_id: userBadge.badge_id,
        earned_at: userBadge.earned_at,
        badge_name: (userBadge.trail_badges as any)?.name || '',
        badge_description: (userBadge.trail_badges as any)?.description || '',
        badge_icon_name: (userBadge.trail_badges as any)?.icon_name || 'Award',
        badge_color: (userBadge.trail_badges as any)?.color || '#000000',
        badge_type: (userBadge.trail_badges as any)?.badge_type || '',
        coins_reward: (userBadge.trail_badges as any)?.coins_reward || 0,
        trail_name: (userBadge.trails as any)?.name || 'Trilha não encontrada'
      })) || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 60000, // 1 minute - badges don't change frequently
    gcTime: 300000, // 5 minutes
  });

  // Derived stats calculation
  const stats: TrailsStats = {
    activeTrails: userTrailsQuery.data?.filter(trail => trail.status === 'active').length || 0,
    completedTrails: userTrailsQuery.data?.filter(trail => trail.status === 'completed').length || 0,
    totalBadges: userBadgesQuery.data?.length || 0,
    averageProgress: userTrailsQuery.data && userTrailsQuery.data.length > 0
      ? Math.round(userTrailsQuery.data.reduce((sum, trail) => sum + trail.progress_percentage, 0) / userTrailsQuery.data.length)
      : 0,
  };

  return {
    trails: userTrailsQuery.data || [],
    badges: userBadgesQuery.data || [],
    stats,
    isLoading: userTrailsQuery.isLoading || userBadgesQuery.isLoading,
    isTrailsLoading: userTrailsQuery.isLoading,
    isBadgesLoading: userBadgesQuery.isLoading,
    error: userTrailsQuery.error || userBadgesQuery.error,
  };
};

// Optimized hook for available trails (templates + user trails)
export const useAvailableTrailsData = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['available-trails-dashboard', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return { templates: [], userTrails: [] };

      // Fetch both templates and available user trails in parallel
      const [templatesResult, userTrailsResult] = await Promise.all([
        supabase
          .from('trail_templates')
          .select(`
            id,
            name,
            description,
            life_area,
            cover_url,
            created_at,
            is_public,
            access_criteria
          `)
          .eq('company_id', currentCompanyId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        
        supabase
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
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (userTrailsResult.error) throw userTrailsResult.error;

      return {
        templates: templatesResult.data || [],
        userTrails: userTrailsResult.data || [],
      };
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
};