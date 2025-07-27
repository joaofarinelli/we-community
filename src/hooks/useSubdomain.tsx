import { useEffect, useState } from 'react';

export const useSubdomain = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    
    console.log('Current hostname:', hostname);
    
    // Domain mapping for Lovable environment
    const getDomainForLovable = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      // Extract domain from URL if it's in the format we expect
      if (hostname.includes('lovable') || hostname === 'lovable.dev') {
        // Map based on project or known patterns
        if (window.location.href.includes('cae-club') || hash.includes('cae-club')) {
          return 'cae-club.weplataforma.com.br';
        }
        // Add more mappings as needed
        return null; // Use main domain logic
      }
      return null;
    };
    
    // Special handling for Lovable editor environment
    if (hostname === 'lovable.dev' || hostname.endsWith('.lovable.dev') || hostname.includes('lovable')) {
      const mappedDomain = getDomainForLovable();
      if (mappedDomain) {
        console.log('Detected Lovable environment, mapping to:', mappedDomain);
        setCustomDomain(mappedDomain);
        setSubdomain(null);
        setIsLoading(false);
        return;
      } else {
        console.log('Detected Lovable environment but no domain mapping, using default');
        setCustomDomain(null);
        setSubdomain(null);
        setIsLoading(false);
        return;
      }
    }
    
    // Known base domains that indicate subdomain structure
    const knownBaseDomains = ['weplataforma.com.br', 'yourplatform.com'];
    
    const parts = hostname.split('.');
    console.log('Hostname parts:', parts);
    
    // Check if hostname ends with any known base domain
    const matchingBaseDomain = knownBaseDomains.find(baseDomain => hostname.endsWith(baseDomain));
    
    if (matchingBaseDomain && hostname !== matchingBaseDomain) {
      // For known platform domains, always treat as custom domain first
      // The database will determine if it's actually a custom domain or subdomain
      console.log('Setting as custom domain:', hostname);
      setCustomDomain(hostname);
      setSubdomain(null);
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