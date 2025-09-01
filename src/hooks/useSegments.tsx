import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export interface Segment {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export const useSegments = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['segments', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('segments')
        .select(`
          id,
          name,
          description,
          color,
          is_active,
          created_at,
          updated_at
        `)
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user count for each segment
      const segmentsWithCount = await Promise.all(
        (data || []).map(async (segment) => {
          const { count } = await supabase
            .from('user_segments')
            .select('*', { count: 'exact', head: true })
            .eq('segment_id', segment.id);
          
          return {
            ...segment,
            user_count: count || 0
          };
        })
      );

      return segmentsWithCount;
    },
    enabled: !!currentCompanyId,
  });
};