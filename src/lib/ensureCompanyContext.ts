import { supabase } from '@/integrations/supabase/client';

interface ContextState {
  companyId: string | null;
  timestamp: number;
  promise: Promise<void> | null;
}

// Global state to track context setting across the app
let contextState: ContextState = {
  companyId: null,
  timestamp: 0,
  promise: null,
};

const CONTEXT_TTL = 2 * 60 * 1000; // 2 minutes

export const ensureCompanyContext = async (companyId: string): Promise<void> => {
  const now = Date.now();
  
  // If context is already set for this company and not expired, return immediately
  if (
    contextState.companyId === companyId && 
    now - contextState.timestamp < CONTEXT_TTL
  ) {
    console.debug('ensureCompanyContext: Context already set for company', companyId);
    return;
  }
  
  // If there's already a call in flight for this company, wait for it
  if (contextState.promise && contextState.companyId === companyId) {
    console.debug('ensureCompanyContext: Waiting for in-flight context setting for company', companyId);
    return contextState.promise;
  }
  
  // Create new promise for setting context
  console.debug('ensureCompanyContext: Setting new context for company', companyId);
  
  const contextPromise = Promise.resolve(supabase.rpc('set_current_company_context', {
    p_company_id: companyId
  })).then(() => {
    contextState.companyId = companyId;
    contextState.timestamp = now;
    contextState.promise = null;
    console.debug('ensureCompanyContext: Successfully set context for company', companyId);
  }).catch((error) => {
    console.error('ensureCompanyContext: Error setting context for company', companyId, error);
    contextState.promise = null;
    throw error;
  });
  
  contextState.promise = contextPromise;
  return contextState.promise;
};

// Reset context state (useful for logout or company switching)
export const resetCompanyContext = (): void => {
  contextState = {
    companyId: null,
    timestamp: 0,
    promise: null,
  };
};