import { usePageBanner, BannerType } from '@/hooks/usePageBanner';
import { ResponsiveBanner } from './responsive-banner';

interface PageBannerProps {
  bannerType: BannerType;
  className?: string;
}

export const PageBanner = ({ bannerType, className = '' }: PageBannerProps) => {
  const { bannerUrl, isLoading } = usePageBanner(bannerType);
  if (isLoading || !bannerUrl) return null;

  return (
    <div className={`mb-6 ${className}`}>
      <ResponsiveBanner
        src={bannerUrl}
        aspectRatio={1536/396}
        maxWidth={1536}
        quality={75}
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};