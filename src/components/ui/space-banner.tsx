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
    <div className={`w-full h-[120px] rounded-lg overflow-hidden mb-6 mx-3 mt-3 ${className}`}>
      <img
        src={bannerUrl}
        alt="Banner do espaço"
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};