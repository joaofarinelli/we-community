import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserCourseCertificate {
  id: string;
  user_id: string;
  company_id: string;
  course_id: string;
  course_title: string;
  certificate_code: string;
  issued_at: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  issued_by?: string | null;
  mentor_name?: string | null;
  mentor_role?: string | null;
  mentor_signature_url?: string | null;
}

export const useUserCertificates = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-certificates', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [] as UserCourseCertificate[];
      const { data, error } = await supabase
        .from('user_course_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return (data || []) as UserCourseCertificate[];
    },
    enabled: !!user?.id && !!currentCompanyId,
    staleTime: 1000 * 60 * 2,
  });
};
