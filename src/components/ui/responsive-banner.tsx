import { useState, useEffect } from 'react';

interface ResponsiveBannerProps {
  src: string;
  alt: string;
  className?: string;
  height?: number;
  onError?: () => void;
}

export const ResponsiveBanner = ({ 
  src, 
  alt, 
  className = '', 
  height = 300,
  onError 
}: ResponsiveBannerProps) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.onload = () => {
      setAspectRatio(img.width / img.height);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
    img.src = src;
  }, [src, onError]);

  if (hasError || !src) {
    return null;
  }

  if (!imageLoaded || !aspectRatio) {
    return (
      <div 
        className={`w-full bg-muted rounded-lg animate-pulse ${className}`}
        style={{ height: `${height}px` }}
      />
    );
  }

  return (
    <div className={`w-full rounded-lg overflow-hidden ${className}`}>
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          background: `url(${src}) center center / contain no-repeat`,
          backgroundSize: 'contain'
        }}
        role="img"
        aria-label={alt}
      />
    </div>
  );
};