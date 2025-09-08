import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserFilters {
  search?: string;
  roles?: string[];
  tagIds?: string[];
  joinedStart?: string;
  joinedEnd?: string;
  courseIds?: string[];
  levelIds?: string[];
  badgeIds?: string[];
}

export interface FilteredUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  joined_at: string;
  tag_ids: string[];
  tag_names: string[];
  posts_count: number;
  courses_count: number;
  level_id: string | null;
  level_name: string | null;
  level_color: string | null;
  badge_ids: string[];
  badge_names: string[];
}

export const useCompanyUsersWithFilters = (
  filters: UserFilters = {}, 
  limit = 20, 
  offset = 0
) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['company-users-filtered', currentCompanyId, filters, limit, offset],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      // Normalize filters - convert empty arrays to null
      const normalizedFilters = {
        p_company_id: currentCompanyId,
        p_search: filters.search || null,
        p_roles: (filters.roles && filters.roles.length > 0) ? filters.roles : null,
        p_tag_ids: (filters.tagIds && filters.tagIds.length > 0) ? filters.tagIds : null,
        p_joined_start: filters.joinedStart || null,
        p_joined_end: filters.joinedEnd || null,
        p_course_ids: (filters.courseIds && filters.courseIds.length > 0) ? filters.courseIds : null,
        p_level_ids: (filters.levelIds && filters.levelIds.length > 0) ? filters.levelIds : null,
        p_badge_ids: (filters.badgeIds && filters.badgeIds.length > 0) ? filters.badgeIds : null,
        p_limit: limit,
        p_offset: offset
      };

      console.log('Fetching users with filters:', filters);
      console.log('Normalized filters for RPC:', normalizedFilters);

      const { data, error } = await supabase.rpc('get_company_users_with_filters', normalizedFilters);

      if (error) {
        console.error('Error fetching filtered users:', error);
        throw error;
      }

      return (data || []) as FilteredUser[];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};

// Hook to get all filtered users (without pagination) for bulk actions
export const useAllFilteredUsers = (filters: UserFilters = {}) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['all-company-users-filtered', currentCompanyId, filters],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      // Normalize filters - convert empty arrays to null
      const normalizedFilters = {
        p_company_id: currentCompanyId,
        p_search: filters.search || null,
        p_roles: (filters.roles && filters.roles.length > 0) ? filters.roles : null,
        p_tag_ids: (filters.tagIds && filters.tagIds.length > 0) ? filters.tagIds : null,
        p_joined_start: filters.joinedStart || null,
        p_joined_end: filters.joinedEnd || null,
        p_course_ids: (filters.courseIds && filters.courseIds.length > 0) ? filters.courseIds : null,
        p_level_ids: (filters.levelIds && filters.levelIds.length > 0) ? filters.levelIds : null,
        p_badge_ids: (filters.badgeIds && filters.badgeIds.length > 0) ? filters.badgeIds : null,
        p_limit: 10000, // High limit to get all users
        p_offset: 0
      };

      console.log('Fetching all users with filters for bulk actions:', filters);
      console.log('Normalized filters for RPC:', normalizedFilters);

      const { data, error } = await supabase.rpc('get_company_users_with_filters', normalizedFilters);

      if (error) {
        console.error('Error fetching all filtered users:', error);
        throw error;
      }

      return (data || []) as FilteredUser[];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};