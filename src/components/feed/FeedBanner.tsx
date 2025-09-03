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
        alt="Banner da empresa"
      />
    </div>
  );
};