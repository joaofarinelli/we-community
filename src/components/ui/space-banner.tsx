import { useSpaceBanner } from '@/hooks/useSpaceBanner';
import { ResponsiveBanner } from './responsive-banner';

interface SpaceBannerProps {
  spaceId: string;
  className?: string;
}

export const SpaceBanner = ({ spaceId, className = '' }: SpaceBannerProps) => {
  const { bannerUrl, isLoading } = useSpaceBanner(spaceId);
  if (isLoading || !bannerUrl) return null;

  return (
    <div className={`mb-6 mx-3 mt-3 ${className}`}>
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