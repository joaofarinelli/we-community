import { usePageBanner, BannerType } from '@/hooks/usePageBanner';
import { ResponsiveBanner } from './responsive-banner';

interface PageBannerProps {
  bannerType: BannerType;
  className?: string;
}

export const PageBanner = ({ bannerType, className = '' }: PageBannerProps) => {
  const { bannerUrl, isLoading } = usePageBanner(bannerType);

  if (isLoading || !bannerUrl) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      <ResponsiveBanner
        src={bannerUrl}
        aspectRatio={1200/400}
        maxWidth={1200}
        maxHeight={400}
        quality={75}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};