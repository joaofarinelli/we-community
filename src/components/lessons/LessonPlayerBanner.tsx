import { useLessonPlayerBanner } from '@/hooks/useLessonPlayerBanner';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';
import { ExternalLink } from 'lucide-react';

export const LessonPlayerBanner = () => {
  const { bannerConfig, isLoading } = useLessonPlayerBanner();

  if (isLoading || !bannerConfig?.imageUrl) {
    return null;
  }

  const handleBannerClick = () => {
    if (!bannerConfig.linkUrl) return;
    
    const url = bannerConfig.linkUrl.startsWith('http') 
      ? bannerConfig.linkUrl 
      : `https://${bannerConfig.linkUrl}`;
    
    if (bannerConfig.openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="w-full mb-6">
      <div 
        className={`relative ${bannerConfig.linkUrl ? 'cursor-pointer' : ''}`}
        onClick={handleBannerClick}
        role={bannerConfig.linkUrl ? 'button' : undefined}
        tabIndex={bannerConfig.linkUrl ? 0 : undefined}
        onKeyDown={(e) => {
          if (bannerConfig.linkUrl && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleBannerClick();
          }
        }}
        aria-label={bannerConfig.linkUrl ? 'Banner clicável' : undefined}
      >
        <ResponsiveBanner
          src={bannerConfig.imageUrl}
          aspectRatio={1300/300}
          maxWidth={1300}
        />
        {bannerConfig.linkUrl && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
};