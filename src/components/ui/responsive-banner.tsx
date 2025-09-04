import { useState, useEffect, useRef, useMemo } from "react";

interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;     // se não passar height, usamos aspectRatio para calcular
  height?: number;          // altura fixa do banner (px)
  maxWidth?: number;        // largura máxima a solicitar para a CDN
  quality?: number;         // 0–100 (default 75)
  className?: string;
  children?: React.ReactNode;
}

/* ---- DPR helpers ---- */
function normalizeDpr(raw: number) {
  if (raw >= 1.8) return 2;
  if (raw >= 1.3) return 1.5;
  return 1;
}

function useDpr() {
  const [dpr, setDpr] = useState(() => normalizeDpr(window.devicePixelRatio || 1));
  useEffect(() => {
    const onResize = () => setDpr(normalizeDpr(window.devicePixelRatio || 1));
    window.addEventListener("resize", onResize); // zoom normalmente dispara 'resize'
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return dpr;
}

/* ---- URL helpers ---- */
// Se src já vier com /cdn-cgi/image/<params>/..., removemos para não duplicar parâmetros
function stripCdnPrefix(input: string) {
  try {
    const u = new URL(input);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("cdn-cgi");
    if (idx !== -1 && parts[idx + 1] === "image") {
      // remove '/cdn-cgi/image/<params>/' e mantém o caminho real do arquivo
      const after = parts.slice(idx + 2); // remove 'cdn-cgi' e 'image'
      const originalPath = after.slice(1).join("/"); // pula o primeiro (os params)
      u.pathname = "/" + originalPath;
      return u.origin + u.pathname + u.search;
    }
    return input;
  } catch {
    return input;
  }
}

// Monta URL no estilo Bubble/Cloudflare: <ORIGIN-DA-IMAGEM>/cdn-cgi/image/params/<CAMINHO-ORIGINAL>
function buildCdnUrl(src: string, opts: { w: number; h: number; dpr: number; q: number }) {
  const clean = stripCdnPrefix(src);
  const u = new URL(clean);
  const originalPath = `${u.pathname}${u.search}`;
  const params = `w=${Math.max(1, Math.round(opts.w))},h=${Math.max(1, Math.round(opts.h))},dpr=${opts.dpr},fit=cover,q=${opts.q}`;
  return `${u.origin}/cdn-cgi/image/${params}${originalPath}`;
}

/* ---- Componente ---- */
export const ResponsiveBanner = ({
  src,
  aspectRatio,
  height = 220,
  maxWidth = 1536,
  quality = 75,
  className = "",
  children,
}: ResponsiveBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const dpr = useDpr();

  // largura do container (compatível com TS/dom antigos: usamos contentRect.width)
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    let raf: number | null = null;

    const ro = new ResizeObserver((entries) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const entry of entries) {
          const w = entry.contentRect?.width ?? el.clientWidth ?? 0;
          if (w > 0) setContainerWidth(Math.min(w, maxWidth));
        }
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxWidth]);

  // altura efetiva para solicitar à CDN
  const computedHeight = useMemo(() => {
    if (height) return Math.round(height);
    if (aspectRatio && containerWidth) return Math.max(1, Math.round(containerWidth / aspectRatio));
    return 220;
  }, [height, aspectRatio, containerWidth]);

  // Preload (CDN → fallback original)
  useEffect(() => {
    if (!containerWidth || !src || !computedHeight) return;

    setIsLoading(true);
    setUseFallback(false);

    // Importante: w/h não são multiplicados por DPR; passamos DPR separado.
    const cdnUrl = buildCdnUrl(src, {
      w: containerWidth,
      h: computedHeight,
      dpr,
      q: quality ?? 75,
    });

    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setUseFallback(true);
      const fallback = new Image();
      fallback.onload = () => setIsLoading(false);
      fallback.onerror = () => setIsLoading(false);
      fallback.src = src;
    };
    img.src = cdnUrl;
  }, [containerWidth, src, computedHeight, dpr, quality]);

  // Skeleton enquanto mede/carrega
  if (!containerWidth || isLoading) {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-muted animate-pulse ${className}`}
        style={{ height: `${computedHeight}px` }}
      />
    );
    }

  const backgroundImage = useFallback
    ? src
    : buildCdnUrl(src, { w: containerWidth, h: computedHeight, dpr, q: quality ?? 75 });

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: `${computedHeight}px`,
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};