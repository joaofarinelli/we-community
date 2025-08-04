import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

/**
 * Hook that sets the company context in Supabase session
 * This ensures RLS policies can access the current company ID
 */
export const useSupabaseContext = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  useEffect(() => {
    const setSupabaseContext = async () => {
      if (user && currentCompanyId) {
        try {
          // Always set the current company ID in the Supabase session context
          // This is crucial for multi-company setups
          await supabase.rpc('set_current_company_context', {
            p_company_id: currentCompanyId
          });
          console.log('✅ Set Supabase context for company:', currentCompanyId);
        } catch (error) {
          console.error('❌ Error setting Supabase context:', error);
          // Retry once in case of temporary failure
          try {
            await supabase.rpc('set_current_company_context', {
              p_company_id: currentCompanyId
            });
            console.log('✅ Retry successful - Set Supabase context for company:', currentCompanyId);
          } catch (retryError) {
            console.error('❌ Retry failed - Error setting Supabase context:', retryError);
          }
        }
      }
    };

    setSupabaseContext();
  }, [user, currentCompanyId]);

  return null;
};