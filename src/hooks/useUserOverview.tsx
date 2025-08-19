import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserOverview {
  profile: {
    id: string;
    user_id: string;
    company_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  posts_count: number;
  points: {
    total_coins: number;
    monthly_coins: number;
  };
  level: {
    name?: string;
    color?: string;
    number?: number;
    icon?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export const useUserOverview = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-overview', userId, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !userId) return null;

      console.log('Fetching user overview for:', userId);

      const { data, error } = await supabase.rpc('get_user_overview', {
        p_user_id: userId,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('Error fetching user overview:', error);
        throw error;
      }

      return data as unknown as UserOverview;
    },
    enabled: !!user?.id && !!currentCompanyId && !!userId,
  });
};