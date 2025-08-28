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

// Enhanced fetch that adds company headers
const enhancedFetch = (originalFetch: typeof fetch) => {
  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const companyId = getGlobalCompanyId();
    
    if (companyId) {
      // Only add header for Supabase API calls
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('supabase.co')) {
        // Preserve existing headers while adding x-company-id
        const existingHeaders = init.headers || {};
        const headersObj = existingHeaders instanceof Headers 
          ? Object.fromEntries(existingHeaders.entries())
          : existingHeaders;
        
        init.headers = {
          ...headersObj,
          'x-company-id': companyId,
        };
        console.log('📡 Adding x-company-id header to request:', companyId, url.split('/').pop());
      }
    }
    
    return originalFetch(input, init);
  };
};

// Wrap global fetch
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = enhancedFetch(originalFetch);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});