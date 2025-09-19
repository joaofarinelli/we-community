import React from 'react';
import { usePageBanner } from '@/hooks/usePageBanner';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

export const FeedBanner = () => {
  const { bannerUrl, isLoading } = usePageBanner('feed');

  // Don't render anything if there's no banner URL or while loading
  if (isLoading || !bannerUrl) {
    return null;
  }

  return (
    <div className="w-full">
      <ResponsiveBanner
        src={bannerUrl}
        aspectRatio={1300/300}
        maxWidth={1300}
      />
    </div>
  );
};