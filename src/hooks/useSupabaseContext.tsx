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
    let isContextSet = false;
    
    const setSupabaseContext = async () => {
      // Prevent setting context multiple times
      if (isContextSet || !user || !currentCompanyId) {
        return;
      }

      console.log('🔧 useSupabaseContext: Setting context for user:', user.id, 'company:', currentCompanyId);
      console.log('🔧 useSupabaseContext: User email:', user.email);
      
      try {
        // Always set the current company ID in the Supabase session context
        // This is crucial for multi-company setups
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId
        });
        isContextSet = true;
        console.log('✅ useSupabaseContext: Set Supabase context for company:', currentCompanyId);
      } catch (error) {
        console.error('❌ useSupabaseContext: Error setting Supabase context:', error);
        // Single retry with backoff to prevent loops
        setTimeout(async () => {
          if (!isContextSet && user && currentCompanyId) {
            try {
              console.log('🔄 useSupabaseContext: Retrying context setting...');
              await supabase.rpc('set_current_company_context', {
                p_company_id: currentCompanyId
              });
              isContextSet = true;
              console.log('✅ useSupabaseContext: Retry successful - Set Supabase context for company:', currentCompanyId);
            } catch (retryError) {
              console.error('❌ useSupabaseContext: Retry failed - Error setting Supabase context:', retryError);
            }
          }
        }, 1000);
      }
    };

    // Only set context when both user and company are available
    if (user && currentCompanyId && !isContextSet) {
      setSupabaseContext();
    }

    // Reset context flag when dependencies change
    return () => {
      isContextSet = false;
    };
  }, [user?.id, currentCompanyId]); // Use user.id instead of user object

  return null;
};