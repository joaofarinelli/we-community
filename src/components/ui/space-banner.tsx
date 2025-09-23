import { useSpaceBanner } from '@/hooks/useSpaceBanner';
import { ResponsiveBanner } from './responsive-banner';

interface SpaceBannerProps {
  spaceId: string;
  className?: string;
}

export const SpaceBanner = ({ spaceId, className = '' }: SpaceBannerProps) => {
  const { bannerUrl, isLoading } = useSpaceBanner(spaceId);

  if (isLoading || !bannerUrl) {
    return null;
  }

  return (
    <div className="w-full">
      <ResponsiveBanner
        src={bannerUrl}
        aspectRatio={3250/750}
        fitMode="contain"
        adaptiveHeight={true}
        className={`w-full ${className}`}
      />
    </div>
  );
};