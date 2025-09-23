import { useState, useEffect, useMemo, useRef } from "react";

export interface ResponsiveBannerProps {
  src: string;
  aspectRatio?: number;     // default 1300/300
  quality?: number;         // default 80
  gravity?: "center" | "auto"; // default "center" (Bubble-like)
  className?: string;
  children?: React.ReactNode;
  fitMode?: "cover" | "contain"; // default "cover"
  adaptiveHeight?: boolean; // if true, height adapts to image aspect ratio
  
  // Legacy props for backward compatibility (ignored)
  maxWidth?: number;
  maxWidthForeground?: number;
  maxWidthBackground?: number;
  qualityForeground?: number;
  qualityBackground?: number;
  focusX?: number;
  focusY?: number;
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
  quality = 95,
  gravity = "center",
  className = "",
  children,
  fitMode = "cover",
  adaptiveHeight = false,
}: ResponsiveBannerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dpr, setDpr] = useState(
    typeof window !== "undefined" ? normalizeDpr(window.devicePixelRatio || 1) : 1
  );

  const finalHeight = useMemo(() => {
    if (!measuredWidth) return Math.min(220, viewportHeight * 0.25);
    const ideal = measuredWidth / aspectRatio;
    
    // For adaptive height mode, use the ideal height without viewport cap
    if (adaptiveHeight) {
      return Math.max(1, ideal);
    }
    
    // For non-adaptive mode, cap at viewport percentage
    const cap = viewportHeight * 0.25;
    return Math.max(1, Math.min(ideal, cap));
  }, [measuredWidth, aspectRatio, viewportHeight, adaptiveHeight]);

  const imageParams = useMemo(() => {
    const w = Math.max(1, Math.round(measuredWidth || 1300));
    const h = Math.max(1, Math.round(w / aspectRatio)); // Use aspect ratio for CDN request
    const q = quality;
    const d = dpr;
    
    return { w, h, q, d };
  }, [measuredWidth, aspectRatio, quality, dpr]);

  function buildImageUrl(originalSrc: string) {
    const clean = stripCdnPrefix(originalSrc);
    const params = [
      `w=${imageParams.w}`,
      `h=${imageParams.h}`,
      `dpr=${imageParams.d}`,
      `fit=cover`,
      `gravity=${gravity}`,
      `q=${imageParams.q}`,
    ].join(",");
    const origin = window.location.origin;
    return `${origin}/cdn-cgi/image/${params}/${clean}`;
  }

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

  useEffect(() => {
    if (!src || !measuredWidth) return;
    setLoading(true);
    setFallback(false);

    const imageUrl = buildImageUrl(src);

    // Preload image
    const img = new Image();
    img.onload = () => {
      setLoading(false);
    };
    img.onerror = () => {
      setFallback(true);
      setLoading(false);
    };
    img.src = imageUrl;
  }, [src, measuredWidth, finalHeight, aspectRatio, quality, dpr, gravity]);

  const finalImageUrl = fallback ? src : buildImageUrl(src);

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
        backgroundImage: `url("${finalImageUrl}")`,
        backgroundSize: fitMode,
        backgroundRepeat: "no-repeat",
        backgroundColor: "var(--muted, #f3f4f6)",
        overflow: "hidden",
      }}
    >
      {/* Children overlay */}
      {children && (
        <div
          style={{
            position: "relative",
            zIndex: 1,
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