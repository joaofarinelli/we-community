import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface CompanyThemeConfig {
  theme_mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  theme_config: Record<string, any>;
}

export const useCompanyTheme = () => {
  const { data: company } = useCompany();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Fetch company theme configuration
  const { data: themeConfig, isLoading } = useQuery({
    queryKey: ['company-theme', company?.id],
    queryFn: async () => {
      if (!company) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('theme_mode, primary_color, theme_config')
        .eq('id', company.id)
        .single();

      if (error) throw error;
      return data as CompanyThemeConfig;
    },
    enabled: !!company,
  });

  // Apply theme configuration
  useEffect(() => {
    if (themeConfig) {
      // Apply theme mode
      if (themeConfig.theme_mode !== 'auto') {
        setTheme(themeConfig.theme_mode);
      } else {
        setTheme('system');
      }

      // Apply primary color to CSS variables
      if (themeConfig.primary_color) {
        applyPrimaryColor(themeConfig.primary_color);
      }
    }
  }, [themeConfig, setTheme]);

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
      queryClient.invalidateQueries({ queryKey: ['company-theme'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
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

  // Convert hex color to HSL
  const hexToHsl = (hex: string) => {
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

  return {
    themeConfig,
    isLoading,
    updateThemeMode,
    updatePrimaryColor,
    isUpdating: updateThemeMutation.isPending,
  };
};