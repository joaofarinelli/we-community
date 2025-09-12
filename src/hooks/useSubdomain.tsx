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
      } else {
        console.log('Detected Lovable environment, no domain mapping - using regular flow');
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
    
    // Check if hostname ends with weplataforma.com.br and has subdomain
    if (hostname.endsWith('weplataforma.com.br') && hostname !== 'weplataforma.com.br') {
      const subdomain = hostname.replace('.weplataforma.com.br', '');
      console.log('✅ Detected subdomain for weplataforma.com.br:', subdomain);
      setSubdomain(subdomain);
      setCustomDomain(null);
    } else if (hostname.endsWith('yourplatform.com') && hostname !== 'yourplatform.com') {
      // Handle other platform domains similarly
      const subdomain = hostname.replace('.yourplatform.com', '');
      console.log('✅ Detected subdomain for yourplatform.com:', subdomain);
      setSubdomain(subdomain);
      setCustomDomain(null);
    } else if (parts.length === 2) {
      // This could be a custom domain (e.g., empresa1.com.br)
      console.log('Setting as custom domain:', hostname);
      setCustomDomain(hostname);
      setSubdomain(null);
    } else if (parts.length > 2) {
      // Check if it's a known base domain pattern but not explicitly handled above
      const matchingBaseDomain = knownBaseDomains.find(baseDomain => hostname.endsWith(baseDomain));
      
      if (matchingBaseDomain && hostname !== matchingBaseDomain) {
        // Extract subdomain from known base domain
        const subdomain = hostname.replace(`.${matchingBaseDomain}`, '');
        console.log('✅ Detected subdomain for', matchingBaseDomain, ':', subdomain);
        setSubdomain(subdomain);
        setCustomDomain(null);
      } else {
        // Unknown multi-part domain, treat as custom domain
        console.log('Setting as custom domain (multi-part):', hostname);
        setCustomDomain(hostname);
        setSubdomain(null);
      }
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