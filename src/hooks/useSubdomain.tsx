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
      const fullUrl = window.location.href;
      const hash = window.location.hash;
      
      console.log('Full URL:', fullUrl);
      console.log('Hash:', hash);
      
      // Extract domain from URL if it's in the format we expect
      if (hostname.includes('lovable') || hostname === 'lovable.dev') {
        // Map based on project or known patterns - check multiple ways
        if (fullUrl.includes('cae-club') || 
            hash.includes('cae-club') || 
            fullUrl.includes('CAE') ||
            document.title.includes('CAE')) {
          console.log('Detected CAE Club project, mapping to custom domain');
          return 'cae-club.weplataforma.com.br';
        }
        
        // For development, always try to map to a company domain
        console.log('Lovable environment detected but no specific mapping found');
        return 'development-fallback'; // Special marker for development
      }
      return null;
    };
    
    // Special handling for Lovable editor environment ONLY
    if ((hostname === 'lovable.dev' || hostname.endsWith('.lovable.dev') || hostname.includes('lovable')) && 
        !hostname.includes('weplataforma.com.br')) {
      const mappedDomain = getDomainForLovable();
      if (mappedDomain && mappedDomain !== 'development-fallback') {
        console.log('Detected Lovable environment, mapping to:', mappedDomain);
        setCustomDomain(mappedDomain);
        setSubdomain(null);
        setIsLoading(false);
        return;
      } else if (mappedDomain === 'development-fallback') {
        console.log('Detected Lovable environment, using development fallback');
        setCustomDomain('development-fallback');
        setSubdomain(null);
        setIsLoading(false);
        return;
      } else {
        console.log('Detected Lovable environment but no domain mapping, using development fallback');
        setCustomDomain('development-fallback');
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