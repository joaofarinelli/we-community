import { useState, useEffect, useRef } from 'react';

interface ResponsiveBannerProps {
  src: string;
  aspectRatio: number;
  maxWidth?: number;
  quality?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ResponsiveBanner = ({ 
  src,
  aspectRatio,
  maxWidth = 1536,
  quality = 75,
  className = '',
  children
}: ResponsiveBannerProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get device pixel ratio and round to supported values
  const getDPR = () => {
    const dpr = window.devicePixelRatio || 1;
    if (dpr >= 2) return 2;
    if (dpr >= 1.5) return 1.5;
    return 1;
  };

  // Generate CDN URL
  const generateCDNUrl = (width: number, height: number) => {
    if (!src) return '';
    
    // Extract domain and path from original URL
    const url = new URL(src);
    const domain = url.origin;
    const path = url.pathname + url.search;
    
    const dpr = getDPR();
    const optimizedWidth = Math.min(Math.ceil(width * dpr), maxWidth);
    const optimizedHeight = Math.ceil(height * dpr);
    
    return `${domain}/cdn-cgi/image/w=${optimizedWidth},h=${optimizedHeight},dpr=${dpr},fit=cover,q=${quality}${path}`;
  };

  // Calculate height based on container width and aspect ratio
  const calculateHeight = (width: number) => {
    return Math.round(width / aspectRatio);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Preload image to avoid flash
  useEffect(() => {
    if (!containerWidth || !src) return;

    const height = calculateHeight(containerWidth);
    const cdnUrl = generateCDNUrl(containerWidth, height);
    
    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
    img.src = cdnUrl;
  }, [containerWidth, src, aspectRatio, maxWidth, quality]);

  if (!containerWidth || isLoading) {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-muted animate-pulse ${className}`}
        style={{
          aspectRatio: aspectRatio.toString(),
          minHeight: '120px'
        }}
      />
    );
  }

  const height = calculateHeight(containerWidth);
  const backgroundImage = generateCDNUrl(containerWidth, height);

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: `${height}px`,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {children}
    </div>
  );
};