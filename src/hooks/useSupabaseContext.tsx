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
          // Set the current company ID in the Supabase session context
          await supabase.rpc('set_config', {
            setting_name: 'app.current_company_id',
            setting_value: currentCompanyId,
            is_local: true
          });
          console.log('Set Supabase context for company:', currentCompanyId);
        } catch (error) {
          console.error('Error setting Supabase context:', error);
        }
      }
    };

    setSupabaseContext();
  }, [user, currentCompanyId]);

  return null;
};