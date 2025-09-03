import { useState, useEffect } from 'react';

interface ResponsiveBannerProps {
  src: string;
  alt: string;
  className?: string;
  maxHeight?: number;
  onError?: () => void;
}

export const ResponsiveBanner = ({ 
  src, 
  alt, 
  className = '', 
  maxHeight,
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
        style={{ 
          aspectRatio: aspectRatio || '16/9',
          maxHeight: maxHeight ? `${maxHeight}px` : undefined
        }}
      />
    );
  }

  return (
    <div className={`w-full rounded-lg overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain"
        style={{
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          objectFit: maxHeight ? 'contain' : 'cover'
        }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
      />
    </div>
  );
};