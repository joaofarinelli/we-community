import { useEffect } from 'react';
import { useCompanyByDomain } from './useCompanyByDomain';
import { useTheme } from 'next-themes';

export const useLoginPageTheme = () => {
  const { data: company } = useCompanyByDomain();
  const { setTheme } = useTheme();

  // Apply theme configuration for login page
  useEffect(() => {
    if (company) {
      // Apply theme mode
      if (company.theme_mode && company.theme_mode !== 'auto') {
        setTheme(company.theme_mode);
      } else {
        setTheme('system');
      }

      // Apply primary color to CSS variables
      if (company.primary_color) {
        applyPrimaryColor(company.primary_color);
      }

      // Apply text colors
      if (company.text_color) {
        applyTextColor(company.text_color);
      }

      if (company.button_text_color) {
        applyButtonTextColor(company.button_text_color);
      }
    }
  }, [company, setTheme]);

  // Apply primary color to CSS variables
  const applyPrimaryColor = (hexColor: string) => {
    const hsl = hexToHsl(hexColor);
    if (hsl) {
      const root = document.documentElement;
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--primary-glow', `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${Math.min(hsl.l + 15, 100)}%`);
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  };

  // Apply text color to CSS variables
  const applyTextColor = (hexColor: string) => {
    const hsl = hexToHsl(hexColor);
    if (hsl) {
      const root = document.documentElement;
      root.style.setProperty('--foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--card-foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--popover-foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--secondary-foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--accent-foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  };

  // Apply button text color to CSS variables
  const applyButtonTextColor = (hexColor: string) => {
    const hsl = hexToHsl(hexColor);
    if (hsl) {
      const root = document.documentElement;
      root.style.setProperty('--primary-foreground', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }
  };

  // Convert hex color to HSL
  const hexToHsl = (hex: string) => {
    if (!hex || hex.length !== 7 || !hex.startsWith('#')) return null;
    
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  return { company };
};