import { useState, useEffect, useRef, useMemo } from "react";

export interface ResponsiveBannerProps {
  src: string;

  /** Se definir, usa altura fixa; se não, usa aspectRatio */
  height?: number;              // vamos usar 400
  aspectRatio?: number;         // opcional se quiser altura por proporção

  /** Limite de largura PEDIDA à CDN (não limita o container) */
  maxWidth?: number;            // vamos usar 2200

  /** Limites visuais de altura do container (opcionais) */
  maxHeight?: number;
  minHeight?: number;

  quality?: number;             // 0–100 (default 75)
  fit?: "cover" | "contain";    // cover = visual hero; contain = zero corte
  focusX?: number;              // 0..100 (âncora horizontal ao recortar)
  focusY?: number;              // 0..100

  /** Largura máx. do BLOCO na página; não use para full-bleed */
  containerMaxWidth?: number | string;
  center?: boolean;             // centraliza o bloco (default true)

  /** Auto trocar para "contain" quando a proporção do container divergir */
  autoContainOnMismatch?: boolean;
  mismatchTolerance?: number;   // default 2%

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
  height,
  aspectRatio,
  maxWidth = 2200,      // cap da CDN
  maxHeight,
  minHeight,
  quality = 75,
  fit = "cover",
  focusX = 50,
  focusY = 50,
  containerMaxWidth,    // para full-bleed, NÃO passar (fica 100%)
  center = true,
  autoContainOnMismatch = false, // desliga para manter "hero"
  mismatchTolerance = 0.02,
  className = "",
  children,
}: ResponsiveBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(0); // largura REAL do container (sem cap)
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const dpr = useDpr();

  // mede com getBoundingClientRect (preciso em zoom/telas grandes)
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    let raf: number | null = null;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || el.clientWidth || 0;
      if (w > 0) setMeasuredWidth(w); // <<< sem Math.min(..., maxWidth)!
    };

    measure();

    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // altura ideal (CSS aceita decimal)
  const idealHeightCss = useMemo(() => {
    if (typeof height === "number" && height > 0) return height;          // 400
    if (aspectRatio && measuredWidth) return measuredWidth / aspectRatio;  // opcional
    return 220;
  }, [height, aspectRatio, measuredWidth]);

  // clamp de altura
  const computedHeightCss = useMemo(() => {
    let h = idealHeightCss;
    if (typeof maxHeight === "number") h = Math.min(h, Math.max(1, maxHeight));
    if (typeof minHeight === "number") h = Math.max(h, Math.max(1, minHeight));
    return h;
  }, [idealHeightCss, maxHeight, minHeight]);

  // cover x contain auto (desligado por padrão aqui)
  const effectiveFit: "cover" | "contain" = useMemo(() => {
    if (!autoContainOnMismatch || !aspectRatio || !measuredWidth || !computedHeightCss) {
      return fit;
    }
    const containerRatio = measuredWidth / computedHeightCss;
    const artRatio = aspectRatio;
    const relDiff = Math.abs(containerRatio - artRatio) / artRatio;
    return relDiff > mismatchTolerance ? "contain" : fit;
  }, [autoContainOnMismatch, mismatchTolerance, aspectRatio, measuredWidth, computedHeightCss, fit]);

  // largura pedida à CDN: capa por maxWidth (ex.: 2200)
  const cdnWidth = useMemo(() => Math.min(measuredWidth, maxWidth), [measuredWidth, maxWidth]);

  // preload (CDN -> fallback)
  useEffect(() => {
    if (!cdnWidth || !src || !computedHeightCss) return;
    setIsLoading(true);
    setUseFallback(false);

    const cdnUrl = buildCdnUrl(src, {
      w: cdnWidth,
      h: computedHeightCss,
      dpr,
      q: quality ?? 75,
      fit: effectiveFit,
    });

    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setUseFallback(true);
      const f = new Image();
      f.onload = () => setIsLoading(false);
      f.onerror = () => setIsLoading(false);
      f.src = src;
    };
    img.src = cdnUrl;
  }, [cdnWidth, src, computedHeightCss, dpr, quality, effectiveFit]);

  // skeleton
  if (!measuredWidth || isLoading) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full ${className}`}
        style={{
          width: "100%",
          maxWidth: containerMaxWidth ?? "100%", // para full-bleed, fica 100%
          marginLeft: center ? "auto" : undefined,
          marginRight: center ? "auto" : undefined,
          height: `${computedHeightCss}px`,
          background: "var(--muted, #f3f4f6)",
        }}
      />
    );
  }

  const backgroundImage = useFallback
    ? src
    : buildCdnUrl(src, {
        w: cdnWidth,
        h: computedHeightCss,
        dpr,
        q: quality ?? 75,
        fit: effectiveFit,
      });

  const fx = Math.min(100, Math.max(0, focusX));
  const fy = Math.min(100, Math.max(0, focusY));

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: "100%",
        maxWidth: containerMaxWidth ?? "100%", // NÃO passe containerMaxWidth para full-bleed
        marginLeft: center ? "auto" : undefined,
        marginRight: center ? "auto" : undefined,

        height: `${computedHeightCss}px`,
        backgroundImage: `url("${backgroundImage}")`,
        backgroundSize: effectiveFit === "contain" ? "contain" : "cover",
        backgroundPosition: `${fx}% ${fy}%`,
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};