import { useEffect, useRef } from 'react';
import { useCompanyTheme } from '@/hooks/useCompanyTheme';
import { useCompanyRealtime } from '@/hooks/useCompanyRealtime';
import { useCompany } from '@/hooks/useCompany';

export const ThemeApplier = () => {
  const { data: company } = useCompany();
  const { themeConfig, isLoading } = useCompanyTheme();
  const isAppliedRef = useRef(false);
  
  useCompanyRealtime();

  useEffect(() => {
    // Diagnostic logging for theme stability
    if (company) {
      console.log('🎨 ThemeApplier: Company loaded:', company.id, 'Theme loading:', isLoading);
    } else {
      console.warn('⚠️ ThemeApplier: Company is null - potential context instability');
    }

    // Prevent unnecessary re-application
    if (themeConfig && !isAppliedRef.current) {
      console.log('✅ ThemeApplier: Theme applied successfully');
      isAppliedRef.current = true;
    } else if (!themeConfig && isAppliedRef.current) {
      console.warn('⚠️ ThemeApplier: Theme lost, resetting applied flag');
      isAppliedRef.current = false;
    }
  }, [company, themeConfig, isLoading]);

  return null;
};