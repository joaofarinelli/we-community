import { useEffect } from 'react';
import { supabase, setGlobalCompanyId } from '@/integrations/supabase/client';
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
        console.log('🔧 useSupabaseContext: Setting context for user:', user.id, 'company:', currentCompanyId);
        console.log('🔧 useSupabaseContext: User email:', user.email);
        
        // Set global company ID for header injection
        setGlobalCompanyId(currentCompanyId);
        
        try {
          // Always set the current company ID in the Supabase session context
          // This is crucial for multi-company setups
          await supabase.rpc('set_current_company_context', {
            p_company_id: currentCompanyId
          });
          console.log('✅ useSupabaseContext: Set Supabase context for company:', currentCompanyId);
        } catch (error) {
          console.error('❌ useSupabaseContext: Error setting Supabase context:', error);
          // Retry once in case of temporary failure
          try {
            console.log('🔄 useSupabaseContext: Retrying context setting...');
            await supabase.rpc('set_current_company_context', {
              p_company_id: currentCompanyId
            });
            console.log('✅ useSupabaseContext: Retry successful - Set Supabase context for company:', currentCompanyId);
          } catch (retryError) {
            console.error('❌ useSupabaseContext: Retry failed - Error setting Supabase context:', retryError);
          }
        }
      } else {
        console.log('⏸️ useSupabaseContext: Skipping context setup - user:', !!user, 'company:', !!currentCompanyId);
        if (user) {
          console.log('⏸️ useSupabaseContext: User email:', user.email);
        }
        // Clear global company ID if no context
        setGlobalCompanyId(null);
      }
    };

    // Only set context when both user and company are available
    if (user && currentCompanyId) {
      setSupabaseContext();
    } else {
      // Clear context if user or company is not available
      setGlobalCompanyId(null);
    }
  }, [user, currentCompanyId]);

  return null;
};