import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';

export interface UserInvite {
  id: string;
  email: string;
  role: string;
  course_access: string[];
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

export const useUserInvites = () => {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['user-invites', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserInvite[];
    },
    enabled: !!company?.id,
  });
};