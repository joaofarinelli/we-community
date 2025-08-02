import { usePageBanner, BannerType } from '@/hooks/usePageBanner';

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
    <div className={`w-full h-[300px] rounded-lg overflow-hidden mb-6 ${className}`}>
      <img
        src={bannerUrl}
        alt="Banner da página"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};