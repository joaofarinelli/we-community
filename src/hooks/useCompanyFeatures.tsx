
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export type CompanyFeature = 
  | 'marketplace' 
  | 'ranking' 
  | 'bank' 
  | 'store' 
  | 'streak' 
  | 'challenges'
  | 'trails'
  | 'members'
  | 'courses'
  | 'calendar';

export interface CompanyFeatures {
  marketplace: boolean;
  ranking: boolean;
  bank: boolean;
  store: boolean;
  streak: boolean;
  challenges: boolean;
  trails: boolean;
  members: boolean;
  courses: boolean;
  calendar: boolean;
}

const DEFAULT_FEATURES: CompanyFeatures = {
  marketplace: true,
  ranking: true,
  bank: true,
  store: true,
  streak: true,
  challenges: true,
  trails: true,
  members: true,
  courses: true,
  calendar: true,
};

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
      // Merge com defaults para garantir que todas as chaves existam
      return { ...DEFAULT_FEATURES, ...features };
    },
    enabled: !!currentCompanyId,
  });
};

export const useIsFeatureEnabled = (feature: CompanyFeature): boolean => {
  const { data: features } = useCompanyFeatures();
  return features?.[feature] ?? DEFAULT_FEATURES[feature];
};
