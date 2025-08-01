import { useSpaceBanner } from '@/hooks/useSpaceBanner';

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
    <div className={`w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6 ${className}`}>
      <img
        src={bannerUrl}
        alt="Banner do espaço"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};