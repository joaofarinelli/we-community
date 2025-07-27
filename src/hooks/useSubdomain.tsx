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
    
    // Known base domains that indicate subdomain structure
    const knownBaseDomains = ['weplataforma.com.br', 'yourplatform.com'];
    
    const parts = hostname.split('.');
    console.log('Hostname parts:', parts);
    
    // Check if hostname ends with any known base domain
    const matchingBaseDomain = knownBaseDomains.find(baseDomain => hostname.endsWith(baseDomain));
    
    if (matchingBaseDomain && hostname !== matchingBaseDomain) {
      // This is using a known platform domain, check if it's a subdomain or custom domain
      const prefix = hostname.replace('.' + matchingBaseDomain, '').replace(matchingBaseDomain, '');
      
      if (prefix && !prefix.includes('.')) {
        // Simple prefix without dots = subdomain (e.g., empresa1.weplataforma.com.br)
        console.log('Setting as subdomain:', prefix);
        setSubdomain(prefix);
        setCustomDomain(null);
      } else {
        // Complex prefix with dots = custom domain (e.g., cae-club.weplataforma.com.br)
        console.log('Setting as custom domain:', hostname);
        setCustomDomain(hostname);
        setSubdomain(null);
      }
    } else if (parts.length === 2) {
      // This could be a custom domain (e.g., empresa1.com.br)
      console.log('Setting as custom domain:', hostname);
      setCustomDomain(hostname);
      setSubdomain(null);
    } else if (parts.length > 2) {
      // Fallback: treat as custom domain if no known base domain matches
      console.log('Setting as custom domain (fallback):', hostname);
      setCustomDomain(hostname);
      setSubdomain(null);
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