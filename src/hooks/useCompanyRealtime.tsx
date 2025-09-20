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

    console.log('🔔 useCompanyRealtime: Setting up realtime for company:', company.id);
    
    const channel = supabase
      .channel(`company-realtime-${company.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies', filter: `id=eq.${company.id}` },
        (payload) => {
          console.log('🔔 Realtime: company updated, invalidating cache for company:', company.id, payload);
          
          // Invalidate all useCompany query variations (fix query key mismatch)
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const queryKey = query.queryKey;
              return Array.isArray(queryKey) && 
                     queryKey.length > 0 &&
                     queryKey[0] === 'company';
            }
          });
          
          // Invalidate theme configuration specifically
          queryClient.invalidateQueries({ queryKey: ['company-theme', company.id] });
          
          // Invalidate company-specific queries
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const queryKey = query.queryKey;
              return Array.isArray(queryKey) && 
                     queryKey.length > 1 &&
                     queryKey.includes(company.id);
            }
          });
          
          // Invalidate all banner queries that depend on company data
          queryClient.invalidateQueries({ queryKey: ['course-banner', company.id] });
          queryClient.invalidateQueries({ queryKey: ['page-banner', company.id] });
          queryClient.invalidateQueries({ queryKey: ['lesson-player-banner', company.id] });
          queryClient.invalidateQueries({ queryKey: ['company-features', company.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, queryClient]);
};
