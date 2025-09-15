import { ReactNode, useLayoutEffect, useState } from 'react';

interface UrlNormalizerProps {
  children: ReactNode;
}

/**
 * Component that normalizes URLs by removing double slashes before rendering children.
 * Uses useLayoutEffect to prevent render flicker and ensure the URL is normalized
 * before React Router processes the route.
 */
export const UrlNormalizer = ({ children }: UrlNormalizerProps) => {
  const [isUrlNormalized, setIsUrlNormalized] = useState(false);

  useLayoutEffect(() => {
    const currentPath = window.location.pathname;
    const normalizedPath = currentPath.replace(/\/+/g, '/'); // Remove double slashes
    
    if (currentPath !== normalizedPath) {
      console.log('[UrlNormalizer] Normalizing URL:', { from: currentPath, to: normalizedPath });
      
      // Preserve search params and hash
      const newUrl = `${window.location.origin}${normalizedPath}${window.location.search}${window.location.hash}`;
      
      // Use replaceState to avoid adding to browser history
      window.history.replaceState(null, '', newUrl);
    }
    
    setIsUrlNormalized(true);
  }, []);

  // Prevent rendering until URL is normalized to avoid route evaluation with double slashes
  if (!isUrlNormalized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};