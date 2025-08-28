import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserMemberSpaces = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userMemberSpaces', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) {
        console.log('🔍 useUserMemberSpaces: Missing user or company:', { user: !!user, currentCompanyId });
        return [];
      }

      console.log('🔍 useUserMemberSpaces: Fetching spaces for user:', user.id, 'company:', currentCompanyId);
      console.log('🔍 useUserMemberSpaces: User email:', user.email, 'currentCompanyId type:', typeof currentCompanyId);

      // Get all spaces the user can see (relies on RLS policy with can_user_see_space)
      // This now includes spaces accessible through access groups
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          space_members!left(
            role,
            joined_at
          ),
          space_categories(
            id,
            name
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ useUserMemberSpaces: Error fetching user member spaces:', error);
        console.error('❌ useUserMemberSpaces: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ useUserMemberSpaces: Found', data?.length || 0, 'spaces');
      console.log('✅ useUserMemberSpaces: Spaces data:', data?.map(s => ({ id: s.id, name: s.name, visibility: s.visibility })));
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};