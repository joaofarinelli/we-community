import { useCompany } from '@/hooks/useCompany';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

export const FeedBanner = () => {
  const { data: company } = useCompany();
  if (!company?.feed_banner_url) return null;

  return (
    <div className="w-full">
      <ResponsiveBanner
        src={company.feed_banner_url}
        aspectRatio={1536/396}
        maxWidth={1536}
        quality={75}
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};