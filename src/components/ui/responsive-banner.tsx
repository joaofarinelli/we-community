import { useState, useEffect, useMemo, useRef } from "react";

export interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;   // default 1300/300
  maxWidth?: number;      // default 1300
  quality?: number;       // default 75
  className?: string;
  children?: React.ReactNode;
}

function normalizeDpr(raw: number) {
  if (raw >= 1.8) return 2;
  if (raw >= 1.3) return 1.5;
  return 1;
}

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

export const ResponsiveBanner = ({
  src,
  aspectRatio = 1300 / 300,
  maxWidth = 1300,
  quality = 75,
  className = "",
  children,
}: ResponsiveBannerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [useFallback, setUseFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dpr, setDpr] = useState(
    typeof window !== "undefined" ? normalizeDpr(window.devicePixelRatio || 1) : 1
  );

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
      setDpr(normalizeDpr(window.devicePixelRatio || 1));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let raf: number | null = null;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || el.clientWidth || 0;
      if (w > 0) setMeasuredWidth(w);
    };

    measure();
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);

    const onWinResize = () => measure();
    window.addEventListener("resize", onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const cssHeight = useMemo(() => {
    if (!measuredWidth) return Math.min(220, viewportHeight * 0.25);
    const ideal = measuredWidth / aspectRatio;
    const cap = viewportHeight * 0.25;
    return Math.max(1, Math.min(ideal, cap));
  }, [measuredWidth, aspectRatio, viewportHeight]);

  const cdnParams = useMemo(() => {
    const w = Math.max(1, Math.round(Math.min(measuredWidth || maxWidth, maxWidth)));
    const h = Math.max(1, Math.round(w / aspectRatio));
    const q = quality ?? 75;
    const d = dpr;
    return { w, h, q, d };
  }, [measuredWidth, maxWidth, aspectRatio, quality, dpr]);

  function buildCdnUrl(originalSrc: string) {
    const clean = stripCdnPrefix(originalSrc);
    const params = `w=${cdnParams.w},h=${cdnParams.h},dpr=${cdnParams.d},fit=contain,q=${cdnParams.q}`;
    const origin = window.location.origin;
    return `${origin}/cdn-cgi/image/${params}/${clean}`;
  }

  useEffect(() => {
    if (!src || !measuredWidth) return;
    setLoading(true);
    setUseFallback(false);
    const url = buildCdnUrl(src);
    const img = new Image();
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setUseFallback(true);
      const f = new Image();
      f.onload = () => setLoading(false);
      f.onerror = () => setLoading(false);
      f.src = src;
    };
    img.src = url;
  }, [src, measuredWidth, aspectRatio, maxWidth, quality, dpr]);

  const backgroundImage = useFallback ? src : buildCdnUrl(src);

  if (!measuredWidth || loading) {
    return (
      <div
        ref={ref}
        className={`relative ${className}`}
        style={{
          width: "100%",
          height: `${cssHeight}px`,
          backgroundColor: "var(--muted, #f3f4f6)",
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        width: "100%",
        height: `${cssHeight}px`,
        backgroundImage: `url("${backgroundImage}")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundColor: "var(--muted, #f3f4f6)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};