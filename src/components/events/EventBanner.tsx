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
        aspectRatio={1200/400}
        maxHeight={400}
        maxWidth={1200}
        quality={75}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};