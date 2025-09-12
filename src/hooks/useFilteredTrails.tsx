import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface TrailFilters {
  search?: string;
  status?: string;
  tagIds?: string[];
  levelIds?: string[];
  badgeIds?: string[];
}

export interface FilteredTrail {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  life_area?: string;
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  user_id: string;
  cover_url?: string;
  profiles: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  user_tags: Array<{
    tag_id: string;
    tag_name: string;
  }>;
  user_level: {
    level_id: string;
    level_name: string;
    level_color: string;
  } | null;
  user_badges: Array<{
    badge_id: string;
    badge_name: string;
  }>;
}

export const useFilteredTrails = (filters: TrailFilters = {}) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['filtered-trails', currentCompanyId, filters],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Base query for trails with template cover_url
      const { data: trails, error } = await supabase
        .from('trails')
        .select(`
          *,
          trail_templates (
            cover_url
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!trails) return [];

      // Apply search filter
      let filteredTrails = trails;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredTrails = trails.filter(trail => 
          trail.name.toLowerCase().includes(searchTerm)
        );
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredTrails = filteredTrails.filter(trail => trail.status === filters.status);
      }

      // Get user profiles for the trails
      const userIds = filteredTrails.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Create profiles map
      const profilesMap = new Map();
      profiles?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      // Apply search filter with user names if needed
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredTrails = trails.filter(trail => {
          const profile = profilesMap.get(trail.user_id);
          return trail.name.toLowerCase().includes(searchTerm) ||
                 profile?.first_name?.toLowerCase().includes(searchTerm) ||
                 profile?.last_name?.toLowerCase().includes(searchTerm);
        });
      }

      // Fetch user tags if tag filter is applied
      let userTagsMap: Map<string, Array<{ tag_id: string; tag_name: string }>> = new Map();
      if (filters.tagIds && filters.tagIds.length > 0) {
        const { data: userTags } = await supabase
          .from('user_tags')
          .select(`
            user_id,
            tag_id,
            tags (
              id,
              name
            )
          `)
          .eq('company_id', currentCompanyId)
          .in('user_id', userIds)
          .in('tag_id', filters.tagIds);

        if (userTags) {
          userTags.forEach(ut => {
            if (!userTagsMap.has(ut.user_id)) {
              userTagsMap.set(ut.user_id, []);
            }
            userTagsMap.get(ut.user_id)?.push({
              tag_id: ut.tag_id,
              tag_name: (ut.tags as any)?.name || ''
            });
          });
        }
      }

      // Fetch user levels if level filter is applied
      let userLevelsMap: Map<string, { level_id: string; level_name: string; level_color: string }> = new Map();
      if (filters.levelIds && filters.levelIds.length > 0) {
        const { data: userLevels } = await supabase
          .from('user_current_level')
          .select(`
            user_id,
            current_level_id,
            user_levels (
              id,
              level_name,
              level_color
            )
          `)
          .eq('company_id', currentCompanyId)
          .in('user_id', userIds)
          .in('current_level_id', filters.levelIds);

        if (userLevels) {
          userLevels.forEach(ul => {
            userLevelsMap.set(ul.user_id, {
              level_id: ul.current_level_id,
              level_name: (ul.user_levels as any)?.level_name || '',
              level_color: (ul.user_levels as any)?.level_color || ''
            });
          });
        }
      }

      // Fetch user badges if badge filter is applied
      let userBadgesMap: Map<string, Array<{ badge_id: string; badge_name: string }>> = new Map();
      if (filters.badgeIds && filters.badgeIds.length > 0) {
        const { data: userBadges } = await supabase
          .from('user_trail_badges')
          .select(`
            user_id,
            badge_id,
            trail_badges (
              id,
              name
            )
          `)
          .eq('company_id', currentCompanyId)
          .in('user_id', userIds)
          .in('badge_id', filters.badgeIds);

        if (userBadges) {
          userBadges.forEach(ub => {
            if (!userBadgesMap.has(ub.user_id)) {
              userBadgesMap.set(ub.user_id, []);
            }
            userBadgesMap.get(ub.user_id)?.push({
              badge_id: ub.badge_id,
              badge_name: (ub.trail_badges as any)?.name || ''
            });
          });
        }
      }

      // Filter trails based on applied filters and combine data
      return filteredTrails.filter(trail => {
        // Tag filter
        if (filters.tagIds && filters.tagIds.length > 0) {
          if (!userTagsMap.has(trail.user_id)) return false;
        }

        // Level filter
        if (filters.levelIds && filters.levelIds.length > 0) {
          if (!userLevelsMap.has(trail.user_id)) return false;
        }

        // Badge filter
        if (filters.badgeIds && filters.badgeIds.length > 0) {
          if (!userBadgesMap.has(trail.user_id)) return false;
        }

        return true;
      }).map(trail => ({
        ...trail,
        cover_url: (trail.trail_templates as any)?.cover_url,
        profiles: profilesMap.get(trail.user_id) || null,
        user_tags: userTagsMap.get(trail.user_id) || [],
        user_level: userLevelsMap.get(trail.user_id) || null,
        user_badges: userBadgesMap.get(trail.user_id) || [],
      }));
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 45000, // 45 seconds
    gcTime: 300000, // 5 minutes
  });
};