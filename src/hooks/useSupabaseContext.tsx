import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

/**
 * Hook that sets the company context in Supabase session
 * This ensures RLS policies can access the current company ID
 */
export const useSupabaseContext = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const setSupabaseContext = async () => {
      if (!user?.id || !currentCompanyId) {
        setReady(false);
        return;
      }

      // Avoid duplicate attempts for the same user+company combination
      const contextKey = `${user.id}-${currentCompanyId}`;
      if (attemptedRef.current === contextKey && ready) {
        return;
      }

      console.debug('useSupabaseContext: Setting context for user:', user.id, 'company:', currentCompanyId);
      
      try {
        setError(null);
        await ensureCompanyContext(currentCompanyId);
        attemptedRef.current = contextKey;
        setReady(true);
        console.debug('useSupabaseContext: Context ready for company:', currentCompanyId);
      } catch (err) {
        console.error('useSupabaseContext: Error setting context:', err);
        setError(err as Error);
        setReady(false);
        
        // Single retry after 1 second
        setTimeout(async () => {
          if (attemptedRef.current !== contextKey) return;
          
          try {
            console.debug('useSupabaseContext: Retrying context setting...');
            await ensureCompanyContext(currentCompanyId);
            setReady(true);
            setError(null);
            console.debug('useSupabaseContext: Retry successful for company:', currentCompanyId);
          } catch (retryError) {
            console.error('useSupabaseContext: Retry failed:', retryError);
            setError(retryError as Error);
          }
        }, 1000);
      }
    };

    setSupabaseContext();
  }, [user?.id, currentCompanyId, ready]);

  return { ready, error };
};