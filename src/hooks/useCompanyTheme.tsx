import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface CompanyThemeConfig {
  theme_mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  text_color: string;
  button_text_color: string;
  theme_config: Record<string, any>;
}

export const useCompanyTheme = () => {
  const { data: company } = useCompany();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  // Local cache for stability protection
  const appliedThemeRef = useRef<CompanyThemeConfig | null>(null);
  const lastCompanyIdRef = useRef<string | null>(null);

  // Fetch company theme configuration
  const { data: themeConfig, isLoading } = useQuery({
    queryKey: ['company-theme', company?.id],
    queryFn: async () => {
      if (!company) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('theme_mode, primary_color, text_color, button_text_color, theme_config')
        .eq('id', company.id)
        .single();

      if (error) throw error;
      return data as CompanyThemeConfig;
    },
    enabled: !!company,
  });

  // Apply theme configuration with stability protection
  useEffect(() => {
    // Detect company context loss
    if (lastCompanyIdRef.current && company?.id && lastCompanyIdRef.current !== company.id) {
      console.log('🎨 Company context changed:', lastCompanyIdRef.current, '->', company.id);
      appliedThemeRef.current = null; // Clear cache on company change
    }

    if (themeConfig) {
      console.log('🎨 Applying theme config for company:', company?.id, themeConfig);
      
      // Apply theme mode
      if (themeConfig.theme_mode !== 'auto') {
        setTheme(themeConfig.theme_mode);
      } else {
        setTheme('system');
      }

      // Apply colors
      if (themeConfig.primary_color) {
        applyPrimaryColor(themeConfig.primary_color);
      }

      if (themeConfig.text_color) {
        applyTextColor(themeConfig.text_color);
      }

      if (themeConfig.button_text_color) {
        applyButtonTextColor(themeConfig.button_text_color);
      }

      // Cache applied theme
      appliedThemeRef.current = themeConfig;
      lastCompanyIdRef.current = company?.id || null;
    } else if (appliedThemeRef.current && !company) {
      // Company context lost but we have cached theme - reapply to prevent theme loss
      const cachedTheme = appliedThemeRef.current;
      console.warn('⚠️ Company context lost, reapplying cached theme:', cachedTheme);
      
      if (cachedTheme.theme_mode !== 'auto') {
        setTheme(cachedTheme.theme_mode);
      }
      if (cachedTheme.primary_color) {
        applyPrimaryColor(cachedTheme.primary_color);
      }
      if (cachedTheme.text_color) {
        applyTextColor(cachedTheme.text_color);
      }
      if (cachedTheme.button_text_color) {
        applyButtonTextColor(cachedTheme.button_text_color);
      }
    } else if (!themeConfig && !appliedThemeRef.current) {
      console.log('🎨 No theme config available and no cache');
    }
  }, [themeConfig, company?.id, setTheme]);

  // Update company theme configuration
  const updateThemeMutation = useMutation({
    mutationFn: async (newConfig: Partial<CompanyThemeConfig>) => {
      if (!company) throw new Error('No company found');

      const { error } = await supabase
        .from('companies')
        .update(newConfig)
        .eq('id', company.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Use specific query keys with company ID
      queryClient.invalidateQueries({ queryKey: ['company-theme', company?.id] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 &&
                 queryKey[0] === 'company';
        }
      });
      toast.success('Configurações de tema atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating theme:', error);
      toast.error('Erro ao atualizar configurações de tema');
    },
  });

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

  const updateThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    updateThemeMutation.mutate({ theme_mode: mode });
  };

  const updatePrimaryColor = (color: string) => {
    updateThemeMutation.mutate({ primary_color: color });
    applyPrimaryColor(color);
  };

  const updateTextColor = (color: string) => {
    updateThemeMutation.mutate({ text_color: color });
    applyTextColor(color);
  };

  const updateButtonTextColor = (color: string) => {
    updateThemeMutation.mutate({ button_text_color: color });
    applyButtonTextColor(color);
  };

  return {
    themeConfig,
    isLoading,
    updateThemeMode,
    updatePrimaryColor,
    updateTextColor,
    updateButtonTextColor,
    isUpdating: updateThemeMutation.isPending,
  };
};