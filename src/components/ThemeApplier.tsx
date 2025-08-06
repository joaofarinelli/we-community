import { useEffect } from 'react';
import { useCompanyTheme } from '@/hooks/useCompanyTheme';
import { useCompanyRealtime } from '@/hooks/useCompanyRealtime';

export const ThemeApplier = () => {
  const { themeConfig } = useCompanyTheme();
  useCompanyRealtime();

  useEffect(() => {
    // Theme is automatically applied by the useCompanyTheme hook
    // This component just ensures the hook is active when the user is authenticated
  }, [themeConfig]);

  return null;
};