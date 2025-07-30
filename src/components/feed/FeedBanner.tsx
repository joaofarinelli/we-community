import React from 'react';
import { useCompany } from '@/hooks/useCompany';
import { Card } from '@/components/ui/card';

export const FeedBanner = () => {
  const { data: company } = useCompany();

  // Don't render anything if there's no banner URL
  if (!company?.feed_banner_url) {
    return null;
  }

  return (
    <div className="feed-banner-container">
      <Card className="overflow-hidden border-0 shadow-md mb-6">
        <div className="relative">
          <img
            src={company.feed_banner_url}
            alt="Banner da empresa"
            className="w-full h-[200px] object-cover"
            onError={(e) => {
              // Hide the component if image fails to load
              const container = e.currentTarget.closest('.feed-banner-container');
              if (container) {
                (container as HTMLElement).style.display = 'none';
              }
            }}
          />
          {/* Optional overlay for better text readability if needed in the future */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Card>
    </div>
  );
};