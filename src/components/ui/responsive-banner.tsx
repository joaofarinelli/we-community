import { useState, useEffect, useRef } from 'react';

interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;
  height?: number;
  maxWidth?: number;
  quality?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ResponsiveBanner = ({ 
  src,
  aspectRatio,
  height = 220,
  maxWidth = 1536,
  quality = 75,
  className = '',
  children
}: ResponsiveBannerProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get device pixel ratio and round to supported values
  const getDPR = () => {
    const dpr = window.devicePixelRatio || 1;
    if (dpr >= 2) return 2;
    if (dpr >= 1.5) return 1.5;
    return 1;
  };

  // Generate CDN URL using current domain
  const generateCDNUrl = (width: number, height: number) => {
    if (!src) return '';
    
    const dpr = getDPR();
    const optimizedWidth = Math.min(Math.ceil(width * dpr), maxWidth);
    const optimizedHeight = Math.ceil(height * dpr);
    
    // Use current domain for CDN and encode the original URL as parameter
    const encodedSrc = encodeURIComponent(src);
    return `${window.location.origin}/cdn-cgi/image/w=${optimizedWidth},h=${optimizedHeight},dpr=${dpr},fit=cover,q=${quality}/${encodedSrc}`;
  };

  // Use fixed height or calculate from aspect ratio
  const getHeight = () => {
    return height || (aspectRatio ? Math.round(containerWidth / aspectRatio) : 220);
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

  // Preload image with fallback support
  useEffect(() => {
    if (!containerWidth || !src) return;

    setIsLoading(true);
    setUseFallback(false);

    const bannerHeight = getHeight();
    const cdnUrl = generateCDNUrl(containerWidth, bannerHeight);
    
    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      // CDN failed, try original image
      setUseFallback(true);
      const fallbackImg = new Image();
      fallbackImg.onload = () => setIsLoading(false);
      fallbackImg.onerror = () => setIsLoading(false);
      fallbackImg.src = src;
    };
    img.src = cdnUrl;
  }, [containerWidth, src, aspectRatio, height, maxWidth, quality]);

  if (!containerWidth || isLoading) {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-muted animate-pulse ${className}`}
        style={{
          height: `${getHeight()}px`
        }}
      />
    );
  }

  const bannerHeight = getHeight();
  const backgroundImage = useFallback ? src : generateCDNUrl(containerWidth, bannerHeight);

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: `${bannerHeight}px`,
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