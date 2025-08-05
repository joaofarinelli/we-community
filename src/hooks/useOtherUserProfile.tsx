import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface OtherUserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  bio?: string;
  profession?: string;
  location?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  is_active: boolean;
  show_email_to_others?: boolean;
  show_coins_to_others?: boolean;
  show_profession_to_others?: boolean;
  show_location_to_others?: boolean;
}

export const useOtherUserProfile = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['other-user-profile', userId, user?.id, currentCompanyId],
    queryFn: async (): Promise<OtherUserProfile | null> => {
      if (!user || !userId || userId === user.id || !currentCompanyId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          first_name,
          last_name,
          email,
          phone,
          bio,
          profession,
          location,
          avatar_url,
          created_at,
          updated_at,
          role,
          is_active,
          show_email_to_others,
          show_coins_to_others,
          show_profession_to_others,
          show_location_to_others
        `)
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching other user profile:', error);
        return null;
      }

      // Apply privacy settings
      if (data) {
        // Check if user is admin/owner to bypass privacy settings
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', currentCompanyId)
          .single();
        
        const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner';
        
        return {
          ...data,
          email: (data.show_email_to_others || isAdmin) ? data.email : undefined,
          profession: (data.show_profession_to_others || isAdmin) ? data.profession : undefined,
          location: (data.show_location_to_others || isAdmin) ? data.location : undefined,
        };
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id && !!currentCompanyId,
  });
};

export const useOtherUserPoints = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['other-user-points', userId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !userId || userId === user.id || !currentCompanyId) return null;

      // Check if user allows showing coins first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('show_coins_to_others')
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (!userProfile?.show_coins_to_others) {
        return null; // User doesn't want to show coins
      }

      const { data, error } = await supabase
        .from('user_points')
        .select('total_coins')
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching other user points:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id && !!currentCompanyId,
  });
};

export const useOtherUserLevel = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['other-user-level', userId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !userId || userId === user.id || !currentCompanyId) return null;

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
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching other user level:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!userId && userId !== user.id && !!currentCompanyId,
  });
};