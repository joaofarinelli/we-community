import { usePageBanner, BannerType } from "@/hooks/usePageBanner";
import { ResponsiveBanner } from "./responsive-banner";

interface PageBannerProps {
  bannerType: BannerType;
  className?: string;
}

export const PageBanner = ({ bannerType, className = "" }: PageBannerProps) => {
  const { bannerUrl, isLoading } = usePageBanner(bannerType);

  if (isLoading || !bannerUrl) return null;

  return (
    <div className={`mb-6 ${className}`}>
      <ResponsiveBanner
        src={bannerUrl}
        // Use a proporção real do arquivo para evitar cortes desnecessários:
        aspectRatio={1536 / 396}
        maxWidth={1536}
        quality={75}
        // Mantém o texto visível à direita (ajuste se precisar):
        focusX={80}
        // Se quiser "zero corte" (letterbox), habilite:
        // fit="contain"
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};