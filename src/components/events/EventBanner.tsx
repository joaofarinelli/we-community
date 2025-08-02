import { AspectRatio } from "@/components/ui/aspect-ratio";

interface EventBannerProps {
  imageUrl?: string;
  title: string;
}

export const EventBanner = ({ imageUrl, title }: EventBannerProps) => {
  if (!imageUrl) return null;

  return (
    <div className="w-full mb-6">
      <div className="h-[300px] bg-muted rounded-lg overflow-hidden">
        <img
          src={imageUrl}
          alt={`Banner do evento: ${title}`}
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
};