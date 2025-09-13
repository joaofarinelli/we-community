import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { supabase } from '@/integrations/supabase/client';

export interface TrailsDashboardData {
  userTrails: any[];
  availableTrails: any[];
  templates: any[];
  badges: any[];
  isLoading: boolean;
  isUserTrailsLoading: boolean;
  isAvailableTrailsLoading: boolean;
  isBadgesLoading: boolean;
}

export const useTrailsDashboardData = (): TrailsDashboardData => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  // Fetch user trails with better caching
  const {
    data: userTrails = [],
    isLoading: isUserTrailsLoading,
  } = useQuery({
    queryKey: ['user-trail-participations', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trails')
        .select(`
          *,
          trail_templates!trails_template_id_fkey (
            cover_url,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 60000, // 1 minute
  });

  // Fetch available trails
  const {
    data: availableTrails = [],
    isLoading: isAvailableTrailsLoading,
  } = useQuery({
    queryKey: ['available-trails', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('company_id', currentCompanyId)
        .neq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 120000, // 2 minutes
  });

  // Fetch trail templates
  const {
    data: templates = [],
  } = useQuery({
    queryKey: ['trail-templates', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trail_templates')
        .select(`
          id,
          name,
          description,
          cover_url,
          created_at,
          access_criteria
        `)
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(template => ({
        ...template,
        access_criteria: template.access_criteria || {
          is_available_for_all: true,
          required_level_id: undefined,
          required_tags: [],
          required_roles: []
        }
      }));
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 300000, // 5 minutes - templates don't change often
  });

  // Fetch user badges
  const {
    data: badges = [],
    isLoading: isBadgesLoading,
  } = useQuery({
    queryKey: ['user-trail-badges', user?.id, currentCompanyId],
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
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 180000, // 3 minutes
  });

  const isLoading = isUserTrailsLoading || isAvailableTrailsLoading || isBadgesLoading;

  return {
    userTrails,
    availableTrails,
    templates,
    badges,
    isLoading,
    isUserTrailsLoading,
    isAvailableTrailsLoading,
    isBadgesLoading,
  };
};