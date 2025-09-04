import { useState, useEffect, useMemo, useRef } from "react";

export interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;           // default 1300/300
  maxWidthForeground?: number;    // default 1300
  maxWidthBackground?: number;    // default 2200
  qualityForeground?: number;     // default 75
  qualityBackground?: number;     // default 60
  focusX?: number;               // default 50 (0-100)
  focusY?: number;               // default 50 (0-100)
  className?: string;
  children?: React.ReactNode;
  
  // Legacy props for backward compatibility
  maxWidth?: number;             // alias for maxWidthForeground
  quality?: number;              // alias for qualityForeground
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
  maxWidthForeground,
  maxWidthBackground = 2200,
  qualityForeground,
  qualityBackground = 60,
  focusX = 50,
  focusY = 50,
  className = "",
  children,
  // Legacy props for backward compatibility
  maxWidth = 1300,
  quality = 75,
}: ResponsiveBannerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [fgFallback, setFgFallback] = useState(false);
  const [bgFallback, setBgFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dpr, setDpr] = useState(
    typeof window !== "undefined" ? normalizeDpr(window.devicePixelRatio || 1) : 1
  );

  // Resolve legacy props
  const finalMaxWidthForeground = maxWidthForeground ?? maxWidth;
  const finalQualityForeground = qualityForeground ?? quality;

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

  const finalHeight = useMemo(() => {
    if (!measuredWidth) return Math.min(220, viewportHeight * 0.25);
    const ideal = measuredWidth / aspectRatio;
    const cap = viewportHeight * 0.25;
    return Math.max(1, Math.min(ideal, cap));
  }, [measuredWidth, aspectRatio, viewportHeight]);

  const fgParams = useMemo(() => {
    const w = Math.max(1, Math.round(Math.min(measuredWidth || finalMaxWidthForeground, finalMaxWidthForeground)));
    const h = Math.max(1, Math.round(w / aspectRatio));
    const q = finalQualityForeground;
    const d = dpr;
    return { w, h, q, d };
  }, [measuredWidth, finalMaxWidthForeground, aspectRatio, finalQualityForeground, dpr]);

  const bgParams = useMemo(() => {
    const w = Math.max(1, Math.round(Math.min(measuredWidth || maxWidthBackground, maxWidthBackground)));
    const h = Math.max(1, Math.round(finalHeight));
    const q = qualityBackground;
    const d = dpr;
    return { w, h, q, d };
  }, [measuredWidth, maxWidthBackground, finalHeight, qualityBackground, dpr]);

  function buildForegroundUrl(originalSrc: string) {
    const clean = stripCdnPrefix(originalSrc);
    const params = `w=${fgParams.w},h=${fgParams.h},dpr=${fgParams.d},fit=contain,q=${fgParams.q}`;
    const origin = window.location.origin;
    return `${origin}/cdn-cgi/image/${params}/${clean}`;
  }

  function buildBackgroundUrl(originalSrc: string) {
    const clean = stripCdnPrefix(originalSrc);
    const params = `w=${bgParams.w},h=${bgParams.h},dpr=${bgParams.d},fit=cover,q=${bgParams.q}`;
    const origin = window.location.origin;
    return `${origin}/cdn-cgi/image/${params}/${clean}`;
  }

  useEffect(() => {
    if (!src || !measuredWidth) return;
    setLoading(true);
    setFgFallback(false);
    setBgFallback(false);

    const fgUrl = buildForegroundUrl(src);
    const bgUrl = buildBackgroundUrl(src);

    let fgLoaded = false;
    let bgLoaded = false;

    const checkComplete = () => {
      if (fgLoaded && bgLoaded) {
        setLoading(false);
      }
    };

    // Preload foreground
    const fgImg = new Image();
    fgImg.onload = () => {
      fgLoaded = true;
      checkComplete();
    };
    fgImg.onerror = () => {
      setFgFallback(true);
      fgLoaded = true;
      checkComplete();
    };
    fgImg.src = fgUrl;

    // Preload background
    const bgImg = new Image();
    bgImg.onload = () => {
      bgLoaded = true;
      checkComplete();
    };
    bgImg.onerror = () => {
      setBgFallback(true);
      bgLoaded = true;
      checkComplete();
    };
    bgImg.src = bgUrl;
  }, [src, measuredWidth, aspectRatio, finalMaxWidthForeground, maxWidthBackground, finalQualityForeground, qualityBackground, dpr, finalHeight]);

  const foregroundImage = fgFallback ? src : buildForegroundUrl(src);
  const backgroundImage = bgFallback ? src : buildBackgroundUrl(src);

  if (!measuredWidth || loading) {
    return (
      <div
        ref={ref}
        className={`relative ${className}`}
        style={{
          width: "100%",
          height: `${finalHeight}px`,
          backgroundColor: "var(--muted, #f3f4f6)",
          overflow: "hidden",
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
        height: `${finalHeight}px`,
        backgroundColor: "var(--muted, #f3f4f6)",
        overflow: "hidden",
      }}
    >
      {/* Background Layer - Desfocused full-bleed */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: "cover",
          backgroundPosition: `${focusX}% ${focusY}%`,
          backgroundRepeat: "no-repeat",
          filter: "blur(16px) brightness(0.95)",
          transform: "scale(1.05)",
          zIndex: 0,
        }}
      />
      
      {/* Foreground Layer - Main image with contain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${foregroundImage}")`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 1,
        }}
      />
      
      {/* Children overlay */}
      {children && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};