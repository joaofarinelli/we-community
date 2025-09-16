import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEventMaterials = (eventId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['eventMaterials', eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return [];

      const { data, error } = await supabase
        .from('event_materials')
        .select(`
          *,
          uploaded_by_profile:profiles!event_materials_uploaded_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!eventId,
  });
};