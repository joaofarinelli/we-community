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
        alt={`Banner do evento: ${title}`}
        maxHeight={220}
      />
    </div>
  );
};