import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from './useCompany';

/**
 * Subscribe to realtime changes on the current company
 * and invalidate related queries to refresh UI (e.g., logo changes).
 */
export const useCompanyRealtime = () => {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel('companies-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies', filter: `id=eq.${company.id}` },
        () => {
          console.log('🔔 Realtime: company updated, invalidating cache');
          // Invalidate all variations of the 'company' queries
          queryClient.invalidateQueries({ queryKey: ['company'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, queryClient]);
};
