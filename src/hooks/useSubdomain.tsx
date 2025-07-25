import { useEffect, useState } from 'react';

export const useSubdomain = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Check if this is a custom domain (no subdomain structure)
    const parts = hostname.split('.');
    
    if (parts.length === 2) {
      // This could be a custom domain (e.g., empresa1.com.br)
      setCustomDomain(hostname);
      setSubdomain(null);
    } else if (parts.length > 2) {
      // This is a subdomain (e.g., empresa1.weplataforma.com.br)
      setSubdomain(parts[0]);
      setCustomDomain(null);
    } else {
      // Single domain or localhost
      setSubdomain(null);
      setCustomDomain(null);
    }
    
    setIsLoading(false);
  }, []);

  return { subdomain, customDomain, isLoading };
};