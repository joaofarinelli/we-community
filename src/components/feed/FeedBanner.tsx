import React from 'react';
import { useCompany } from '@/hooks/useCompany';
// imports iguais +:
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

// ...
{isLoading ? (
  <div className="w-full h-[200px] bg-muted animate-pulse rounded-lg" />
) : bannerUrl ? (
  <div className="relative w-full rounded-lg overflow-hidden border">
    <ResponsiveBanner
      src={bannerUrl}
      aspectRatio={1536/396}
      maxWidth={1536}
      quality={75}
      focusX={80}
      containerMaxWidth={1200}   // << largura máxima do bloco
      className="rounded-lg"
    />
    {/* botões e input iguais */}
  </div>
) : (/* área de upload igual */)}