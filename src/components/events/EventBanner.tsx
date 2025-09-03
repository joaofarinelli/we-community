import { ResponsiveBanner } from "@/components/ui/responsive-banner";

interface EventBannerProps {
  imageUrl?: string;
  title: string;
}

export const EventBanner = ({ imageUrl, title }: EventBannerProps) => {
  if (!imageUrl) return null;

  return (
    <div className="w-full mb-6">
      <ResponsiveBanner
        src={imageUrl}
        aspectRatio={16/9}
        maxWidth={1536}
        quality={75}
        className="h-[220px] rounded-lg overflow-hidden"
      />
    </div>
  );
};