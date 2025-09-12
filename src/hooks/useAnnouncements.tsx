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

      // First, get the announcement recipients for this user
      const { data: recipients, error: recipientsError } = await supabase
        .from('announcement_recipients')
        .select('id, announcement_id, user_id, status, viewed_at, dismissed_at, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (recipientsError) throw recipientsError;
      if (!recipients || recipients.length === 0) return [];

      // Then get the announcements data separately
      const announcementIds = recipients.map(r => r.announcement_id);
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('id, title, content, is_mandatory, created_at, expires_at, image_url, is_active')
        .in('id', announcementIds)
        .eq('company_id', currentCompanyId)
        .eq('is_active', true);

      if (announcementsError) throw announcementsError;

      // Combine the data on the client side
      const transformedData: AnnouncementRecipient[] = recipients.map((recipient) => {
        const announcement = announcements?.find(a => a.id === recipient.announcement_id);
        return {
          id: recipient.id,
          announcement_id: recipient.announcement_id,
          user_id: recipient.user_id,
          status: recipient.status as 'pending' | 'viewed' | 'dismissed',
          viewed_at: recipient.viewed_at,
          dismissed_at: recipient.dismissed_at,
          created_at: recipient.created_at,
          announcement: announcement || {
            id: recipient.announcement_id,
            title: 'Anúncio não encontrado',
            content: '',
            is_mandatory: false,
            created_at: new Date().toISOString(),
            is_active: false
          }
        };
      }).filter(item => item.announcement && announcements?.find(a => a.id === item.announcement_id));
      
      return transformedData;
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};