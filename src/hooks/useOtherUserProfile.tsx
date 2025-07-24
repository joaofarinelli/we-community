import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OtherUserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  is_active: boolean;
}

export const useOtherUserProfile = (userId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['other-user-profile', userId, user?.id],
    queryFn: async (): Promise<OtherUserProfile | null> => {
      if (!user || !userId || userId === user.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          email,
          phone,
          created_at,
          updated_at,
          role,
          is_active
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching other user profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id,
  });
};

export const useOtherUserPoints = (userId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['other-user-points', userId, user?.id],
    queryFn: async () => {
      if (!user || !userId || userId === user.id) return null;

      // Get user's company ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('user_points')
        .select('total_coins')
        .eq('user_id', userId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) {
        console.error('Error fetching other user points:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id,
  });
};

export const useOtherUserLevel = (userId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['other-user-level', userId, user?.id],
    queryFn: async () => {
      if (!user || !userId || userId === user.id) return null;

      // Get user's company ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('user_current_level')
        .select(`
          current_coins,
          user_levels!user_current_level_current_level_id_fkey(
            level_name,
            level_color,
            level_icon,
            level_number
          )
        `)
        .eq('user_id', userId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) {
        console.error('Error fetching other user level:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id,
  });
};