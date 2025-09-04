import React from 'react';
import { useCompany } from '@/hooks/useCompany';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

export const FeedBanner = () => {
  const { data: company } = useCompany();

  // Don't render anything if there's no banner URL
  if (!company?.feed_banner_url) {
    return null;
  }

  return (
    <div className="w-full">
      <ResponsiveBanner
        src={company.feed_banner_url}
        height={400}
        maxWidth={2200}
        quality={75}
        fit="cover"
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};