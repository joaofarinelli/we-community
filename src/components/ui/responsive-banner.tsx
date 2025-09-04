import { useState, useEffect, useRef, useMemo } from "react";

interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;
  height?: number;
  maxWidth?: number;
  quality?: number;
  className?: string;
  children?: React.ReactNode;
}

function normalizeDpr(raw: number) {
  if (raw >= 1.8) return 2;
  if (raw >= 1.3) return 1.5;
  return 1;
}

function useDpr() {
  const [dpr, setDpr] = useState(() => normalizeDpr(window.devicePixelRatio || 1));
  useEffect(() => {
    const onResize = () => setDpr(normalizeDpr(window.devicePixelRatio || 1));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return dpr;
}

/** Se src já vem com /cdn-cgi/image/<params>/..., remove o prefixo para reaplicar com novos params */
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

/** Monta a URL estilo Bubble: <ORIGIN-DA-IMAGEM>/cdn-cgi/image/w=...,h=...,dpr=...,fit=cover,q=.../<CAMINHO-ORIGINAL> */
function buildCdnUrl(src: string, opts: { w: number; h: number; dpr: number; q: number }) {
  const clean = stripCdnPrefix(src);
  const u = new URL(clean);
  const originalPath = `${u.pathname}${u.search}`;
  const params = `w=${Math.max(1, Math.round(opts.w))},h=${Math.max(1, Math.round(opts.h))},dpr=${opts.dpr},fit=cover,q=${opts.q}`;
  return `${u.origin}/cdn-cgi/image/${params}${originalPath}`;
}

export const ResponsiveBanner = ({
  src,
  aspectRatio,
  height = 220,
  maxWidth = 1536,
  quality = 75,
  className = "",
  children,
}: ResponsiveBannerProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dpr = useDpr();

  const computedHeight = useMemo(() => {
    if (height) return height;
    if (aspectRatio && containerWidth) return Math.round(containerWidth / aspectRatio);
    return 220;
  }, [height, aspectRatio, containerWidth]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    let raf: number | null = null;

    const ro = new ResizeObserver((entries) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const entry of entries) {
          const w = entry.contentBoxSize
            ? Array.isArray(entry.contentBoxSize)
              ? entry.contentBoxSize[0].inlineSize
              : entry.contentBoxSize.inlineSize
            : entry.contentRect.width;
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

  // Preload imagem (CDN primeiro; se falhar, original)
  useEffect(() => {
    if (!containerWidth || !src || !computedHeight) return;

    setIsLoading(true);
    setUseFallback(false);

    // IMPORTANTE: w/h NÃO multiplicam pelo DPR — o DPR vai separado.
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