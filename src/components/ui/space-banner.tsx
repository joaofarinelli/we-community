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
    <div className={`mb-6 ${className}`}>
      <ResponsiveBanner
        src={bannerUrl}
        aspectRatio={16/6}
        maxWidth={1200}
      />
    </div>
  );
};