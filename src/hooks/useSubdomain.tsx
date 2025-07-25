import { useEffect, useState } from 'react';

export const useSubdomain = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    
    console.log('Current hostname:', hostname);
    
    // Special handling for Lovable editor environment
    if (hostname === 'lovable.dev' || hostname.endsWith('.lovable.dev') || hostname.includes('lovable')) {
      console.log('Detected Lovable environment, setting custom domain to lovable.dev');
      setCustomDomain('lovable.dev');
      setSubdomain(null);
      setIsLoading(false);
      return;
    }
    
    // Check if this is a custom domain (no subdomain structure)
    const parts = hostname.split('.');
    
    console.log('Hostname parts:', parts);
    
    if (parts.length === 2) {
      // This could be a custom domain (e.g., empresa1.com.br)
      console.log('Setting as custom domain:', hostname);
      setCustomDomain(hostname);
      setSubdomain(null);
    } else if (parts.length > 2) {
      // This is a subdomain (e.g., empresa1.weplataforma.com.br)
      console.log('Setting as subdomain:', parts[0]);
      setSubdomain(parts[0]);
      setCustomDomain(null);
    } else {
      // Single domain or localhost
      console.log('No subdomain or custom domain detected');
      setSubdomain(null);
      setCustomDomain(null);
    }
    
    setIsLoading(false);
  }, []);

  return { subdomain, customDomain, isLoading };
};