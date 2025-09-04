import { ResponsiveBanner } from "@/components/ui/responsive-banner";

interface EventBannerProps {
  imageUrl?: string;
  title: string;
}

export const EventBanner = ({ imageUrl }: EventBannerProps) => {
  if (!imageUrl) return null;
  return (
    <div className="w-full mb-6">
      <ResponsiveBanner
        src={imageUrl}
        aspectRatio={1536/396}
        maxWidth={1536}
        quality={75}
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};