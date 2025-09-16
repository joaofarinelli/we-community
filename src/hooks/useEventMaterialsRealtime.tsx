import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

/**
 * Subscribe to realtime changes on event_materials for a specific event
 * and invalidate related queries to refresh UI.
 */
export const useEventMaterialsRealtime = (eventId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !eventId) return;

    console.log('🔔 Setting up realtime subscription for event materials:', eventId);

    const channel = supabase
      .channel(`event-materials-${eventId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_materials',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('🔔 Realtime: event_materials changed:', payload);
          
          // Invalidate the specific event materials query
          queryClient.invalidateQueries({ 
            queryKey: ['eventMaterials', eventId] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up realtime subscription for event materials:', eventId);
      supabase.removeChannel(channel);
    };
  }, [eventId, user?.id, queryClient]);
};