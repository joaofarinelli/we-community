import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

export interface UserFilters {
  search?: string;
  roles?: string[];
  tagIds?: string[];
  joinedStart?: string;
  joinedEnd?: string;
  courseIds?: string[];
}

export interface FilteredUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  joined_at: string;
  tag_ids: string[];
  tag_names: string[];
  posts_count: number;
  courses_count: number;
}

export const useCompanyUsersWithFilters = (
  filters: UserFilters = {}, 
  limit = 20, 
  offset = 0,
  contextReady = true
) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['company-users-filtered', currentCompanyId, filters, limit, offset],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      console.debug('useCompanyUsersWithFilters: Starting query for company:', currentCompanyId);

      // Ensure company context is set before the query
      await ensureCompanyContext(currentCompanyId);

      const { data, error } = await supabase.rpc('get_company_users_with_filters', {
        p_company_id: currentCompanyId,
        p_search: filters.search || null,
        p_roles: filters.roles || null,
        p_tag_ids: filters.tagIds || null,
        p_joined_start: filters.joinedStart || null,
        p_joined_end: filters.joinedEnd || null,
        p_course_ids: filters.courseIds || null,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('useCompanyUsersWithFilters: Error fetching filtered users:', error);
        throw error;
      }

      console.debug('useCompanyUsersWithFilters: Successfully fetched', data?.length || 0, 'users');
      return (data || []) as FilteredUser[];
    },
    enabled: !!user?.id && !!currentCompanyId && contextReady,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};