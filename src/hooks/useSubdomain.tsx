import { useEffect, useState } from 'react';

export const useSubdomain = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Extract subdomain from hostname
    const parts = hostname.split('.');
    
    // If we have more than 2 parts (e.g., subdomain.domain.com), extract the subdomain
    if (parts.length > 2) {
      setSubdomain(parts[0]);
    } else {
      // No subdomain (e.g., domain.com or localhost)
      setSubdomain(null);
    }
    
    setIsLoading(false);
  }, []);

  return { subdomain, isLoading };
};