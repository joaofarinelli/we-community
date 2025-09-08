import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_mandatory: boolean;
  created_at: string;
  expires_at?: string;
  image_url?: string;
  is_active: boolean;
}

export interface AnnouncementRecipient {
  id: string;
  announcement_id: string;
  user_id: string;
  status: 'pending' | 'viewed' | 'dismissed';
  viewed_at?: string;
  dismissed_at?: string;
  created_at: string;
  announcement: Announcement;
}

export const useAnnouncements = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['announcements', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};

export const useUserAnnouncements = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-announcements', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('announcement_recipients')
        .select(`
          *,
          announcements(*)
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData: AnnouncementRecipient[] = (data || []).map((item: any) => ({
        id: item.id,
        announcement_id: item.announcement_id,
        user_id: item.user_id,
        status: item.status,
        viewed_at: item.viewed_at,
        dismissed_at: item.dismissed_at,
        created_at: item.created_at,
        announcement: item.announcements
      }));
      
      return transformedData;
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};