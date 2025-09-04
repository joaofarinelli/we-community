import { useCompany } from '@/hooks/useCompany';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

export const FeedBanner = () => {
  const { data: company } = useCompany();
  if (!company?.feed_banner_url) return null;

  return (
    <div className="w-full">
      <ResponsiveBanner
        src={company.feed_banner_url}
        aspectRatio={1200/400}
        maxWidth={1200}
        maxHeight={400}
        containerMaxWidth={1200}
        quality={75}
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};