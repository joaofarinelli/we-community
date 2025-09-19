import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vzwnlgvggxfcbyamdarv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d25sZ3ZnZ3hmY2J5YW1kYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzc3OTAsImV4cCI6MjA2ODg1Mzc5MH0.Obg46XyXO0HGdacgpttOU_-4BAgg7UTRdd6gDLCiiXY";

// Global company context
let globalCompanyId: string | null = null;

export const setGlobalCompanyId = (companyId: string | null) => {
  globalCompanyId = companyId;
  console.log('🌐 Global company ID set to:', companyId);
  
  // Persist in sessionStorage
  if (companyId) {
    sessionStorage.setItem('current_company_id', companyId);
  } else {
    sessionStorage.removeItem('current_company_id');
  }
};

export const getGlobalCompanyId = (): string | null => {
  // Try memory first, then sessionStorage
  if (globalCompanyId) return globalCompanyId;
  
  const stored = sessionStorage.getItem('current_company_id');
  if (stored) {
    globalCompanyId = stored;
    return stored;
  }
  
  return null;
};

// Initialize from sessionStorage on module load
const storedCompanyId = sessionStorage.getItem('current_company_id');
if (storedCompanyId) {
  globalCompanyId = storedCompanyId;
  console.log('🔄 Restored company ID from sessionStorage:', storedCompanyId);
}

// Functions that don't require company context (used to discover companies)
const FUNCTIONS_WITHOUT_COMPANY_CONTEXT = [
  'get_user_accessible_companies',
  'find_company_by_domain',
  'set_current_company_context'
];

// Enhanced fetch that adds company headers
const enhancedFetch = (originalFetch: typeof fetch) => {
  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const companyId = getGlobalCompanyId();

    const isSupabaseCall = url.includes('supabase.co');
    // Extract RPC function name if present
    const rpcMatch = /\/rest\/v1\/rpc\/([^\/?#]+)/.exec(url);
    const rpcName = rpcMatch?.[1] ?? null;
    const isRpcCall = Boolean(rpcName);
    const requiresCompanyContext = isRpcCall ? !FUNCTIONS_WITHOUT_COMPANY_CONTEXT.includes(rpcName!) : false;

    if (isSupabaseCall) {
      const existingHeaders = init.headers || {};
      const headersObj = existingHeaders instanceof Headers
        ? Object.fromEntries(existingHeaders.entries())
        : existingHeaders as Record<string, string>;

      // Add header when we have a companyId and it's not an excluded RPC
      if (companyId && (!isRpcCall || requiresCompanyContext)) {
        init.headers = {
          ...headersObj,
          'x-company-id': companyId,
        };
        // Only log for RPC calls to avoid spam
        if (isRpcCall) {
          console.log('📡 Adding x-company-id header to RPC:', rpcName, 'companyId:', companyId);
        }
      } else if (!companyId && requiresCompanyContext) {
        // Only warn when an RPC explicitly requires context
        console.warn('⚠️ No company ID available for request:', rpcName);
      } else {
        // Keep headers untouched for excluded RPCs or when no context is required
        init.headers = headersObj as any;
      }
    }

    return originalFetch(input, init);
  };
};

// Create wrapped fetch for Supabase client
const wrappedFetch = enhancedFetch(fetch);

// Also wrap global fetch for other uses
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = enhancedFetch(originalFetch);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: wrappedFetch,
  }
});