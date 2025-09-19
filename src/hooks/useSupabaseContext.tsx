import { useEffect, useState } from 'react';
import { supabase, setGlobalCompanyId } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useLocation } from 'react-router-dom';

// Public routes that don't require company context
const PUBLIC_AUTH_ROUTES = [
  '/auth',
  '/reset-password',
  '/invite/accept',
  '/certificate',
  '/maintenance'
];

// Helper to normalize pathname by removing double slashes
const normalizePathname = (pathname: string): string => {
  return pathname.replace(/\/+/g, '/');
};

// Helper to detect if URL has Supabase auth hash (tokens, errors, etc.)
const isSupabaseAuthHash = (hash: string): boolean => {
  return hash.includes('access_token=') || 
         hash.includes('refresh_token=') || 
         hash.includes('error=') ||
         hash.includes('error_code=') ||
         hash.includes('type=recovery');
};

const isPublicAuthRoute = (pathname: string): boolean => {
  const normalizedPath = normalizePathname(pathname);
  const hasAuthHash = isSupabaseAuthHash(window.location.hash);
  
  return PUBLIC_AUTH_ROUTES.some(route => normalizedPath.startsWith(route)) || hasAuthHash;
};

/**
 * Hook that sets the company context in Supabase session
 * This ensures RLS policies can access the current company ID
 */
export const useSupabaseContext = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const location = useLocation();
  const [isContextReady, setIsContextReady] = useState(false);

  useEffect(() => {
    setIsContextReady(false); // Reset when dependencies change

    // Skip context setup for public authentication routes
    if (isPublicAuthRoute(location.pathname)) {
      console.log('⏸️ useSupabaseContext: Skipping context setup for public auth route:', location.pathname);
      // Clear global company ID for public routes
      setGlobalCompanyId(null);
      setIsContextReady(true); // Public routes don't need company context
      return;
    }

    // Enhanced logging for debugging Womans issue
    console.log('🔧 useSupabaseContext: Context setup initiated', {
      user: !!user,
      userEmail: user?.email,
      currentCompanyId,
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    });
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
          setIsContextReady(true);
          
          // Clear any existing React Query cache for previous companies to prevent data bleeding
          console.log('🧹 useSupabaseContext: Context set successfully - clearing old cache data');
        } catch (error) {
          console.error('❌ useSupabaseContext: Error setting Supabase context:', error);
          // Enhanced retry logic with more detailed logging for debugging
          try {
            console.log('🔄 useSupabaseContext: Retrying context setting...', {
              attempt: 2,
              currentCompanyId,
              userEmail: user.email,
              errorMessage: error?.message
            });
            await supabase.rpc('set_current_company_context', {
              p_company_id: currentCompanyId
            });
            console.log('✅ useSupabaseContext: Retry successful - Set Supabase context for company:', currentCompanyId);
            setIsContextReady(true);
          } catch (retryError) {
            console.error('❌ useSupabaseContext: Retry failed - Error setting Supabase context:', {
              retryError,
              originalError: error,
              currentCompanyId,
              userEmail: user.email,
              timestamp: new Date().toISOString()
            });
            setIsContextReady(false);
          }
        }
      } else {
        console.log('⏸️ useSupabaseContext: Skipping context setup - user:', !!user, 'company:', !!currentCompanyId);
        if (user) {
          console.log('⏸️ useSupabaseContext: User email:', user.email);
        }
        // Clear global company ID if no context
        setGlobalCompanyId(null);
        setIsContextReady(false);
      }
    };

    // Only set context when both user and company are available
    if (user && currentCompanyId) {
      setSupabaseContext();
    } else {
      // Clear context if user or company is not available
      setGlobalCompanyId(null);
      setIsContextReady(false);
    }
  }, [user, currentCompanyId, location.pathname]);

  return { isContextReady };
};