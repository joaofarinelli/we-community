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
        height={220}
        maxWidth={1536}
        quality={75}
        fit="contain"
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};