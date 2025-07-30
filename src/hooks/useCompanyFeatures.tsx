import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export type CompanyFeature = 
  | 'marketplace' 
  | 'ranking' 
  | 'bank' 
  | 'store' 
  | 'streak' 
  | 'challenges';

export interface CompanyFeatures {
  marketplace: boolean;
  ranking: boolean;
  bank: boolean;
  store: boolean;
  streak: boolean;
  challenges: boolean;
}

export const useCompanyFeatures = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['company-features', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('enabled_features')
        .eq('id', currentCompanyId)
        .single();

      if (error) throw error;

      const features = data?.enabled_features as any;
      return features || {
        marketplace: true,
        ranking: true,
        bank: true,
        store: true,
        streak: true,
        challenges: true
      };
    },
    enabled: !!currentCompanyId,
  });
};

export const useIsFeatureEnabled = (feature: CompanyFeature): boolean => {
  const { data: features } = useCompanyFeatures();
  return features?.[feature] ?? false;
};