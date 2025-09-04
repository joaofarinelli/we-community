import { useState, useEffect, useRef, useMemo } from "react";

export interface ResponsiveBannerProps {
  src: string;
  /** Proporção da arte. Ex.: 1536/396 (~3.878) */
  aspectRatio?: number;
  /** Altura fixa (px). Evite se quiser preservar a composição sem cortes. */
  height?: number;
  /** Largura máx. solicitada à CDN (default 1536) */
  maxWidth?: number;
  /** Qualidade 0–100 (default 75) */
  quality?: number;
  /** cover (padrão) corta quando precisa; contain não corta (pode “letterbox”) */
  fit?: "cover" | "contain";
  /** Foco horizontal/vertical (0–100%). Útil quando existe corte. */
  focusX?: number;
  focusY?: number;

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
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return dpr;
}

/* ---- URL helpers ---- */
function stripCdnPrefix(input: string) {
  try {
    const u = new URL(input);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("cdn-cgi");
    if (idx !== -1 && parts[idx + 1] === "image") {
      const after = parts.slice(idx + 2);
      const originalPath = after.slice(1).join("/");
      u.pathname = "/" + originalPath;
      return u.origin + u.pathname + u.search;
    }
    return input;
  } catch {
    return input;
  }
}
function buildCdnUrl(
  src: string,
  opts: { w: number; h: number; dpr: number; q: number; fit: "cover" | "contain" }
) {
  const clean = stripCdnPrefix(src);
  const u = new URL(clean);
  const originalPath = `${u.pathname}${u.search}`;
  const params =
    `w=${Math.max(1, Math.round(opts.w))},` +
    `h=${Math.max(1, Math.round(opts.h))},` +
    `dpr=${opts.dpr},` +
    `fit=${opts.fit},` +
    `q=${opts.q}`;
  return `${u.origin}/cdn-cgi/image/${params}${originalPath}`;
}

/* ---- Component ---- */
export const ResponsiveBanner = ({
  src,
  aspectRatio,
  height,
  maxWidth = 1536,
  quality = 75,
  fit = "cover",
  focusX = 50,
  focusY = 50,
  className = "",
  children,
}: ResponsiveBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const dpr = useDpr();

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

  const computedHeight = useMemo(() => {
    if (typeof height === "number" && height > 0) return Math.round(height);
    if (aspectRatio && containerWidth) return Math.max(1, Math.round(containerWidth / aspectRatio));
    return 220;
  }, [height, aspectRatio, containerWidth]);

  useEffect(() => {
    if (!containerWidth || !src || !computedHeight) return;
    setIsLoading(true);
    setUseFallback(false);

    const cdnUrl = buildCdnUrl(src, {
      w: containerWidth,
      h: computedHeight,
      dpr,
      q: quality ?? 75,
      fit,
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
  }, [containerWidth, src, computedHeight, dpr, quality, fit]);

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
    : buildCdnUrl(src, { w: containerWidth, h: computedHeight, dpr, q: quality ?? 75, fit });

  const fx = Math.min(100, Math.max(0, focusX));
  const fy = Math.min(100, Math.max(0, focusY));

  return (
    <div
      ref={containerRef}
      className={`w-full relative ${className}`}
      style={{
        height: `${computedHeight}px`,
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: fit === "contain" ? "contain" : "cover",
        backgroundPosition: `${fx}% ${fy}%`,
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};