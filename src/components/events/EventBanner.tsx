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
        height={400}
        maxWidth={2200}
        quality={75}
        fit="cover"
        focusX={80}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};