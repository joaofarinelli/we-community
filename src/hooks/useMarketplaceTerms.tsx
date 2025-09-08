import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface MarketplaceTerms {
  id: string;
  company_id: string;
  version: number;
  content: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateTermsData {
  content: string;
}

export const useMarketplaceTerms = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['marketplaceTerms', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return null;

      const { data, error } = await supabase
        .from('marketplace_terms')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentCompanyId,
  });
};

export const useMarketplaceTermsHistory = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['marketplaceTermsHistory', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('marketplace_terms')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
  });
};

export const useCreateMarketplaceTerms = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (data: CreateTermsData) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!currentCompanyId) throw new Error('Company context not available');

      // Get current version number
      const { data: latestTerms } = await supabase
        .from('marketplace_terms')
        .select('version')
        .eq('company_id', currentCompanyId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const newVersion = (latestTerms?.version || 0) + 1;

      // Deactivate existing terms
      await supabase
        .from('marketplace_terms')
        .update({ is_active: false })
        .eq('company_id', currentCompanyId)
        .eq('is_active', true);

      // Create new terms
      const { data: newTerms, error } = await supabase
        .from('marketplace_terms')
        .insert({
          company_id: currentCompanyId,
          version: newVersion,
          content: data.content,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newTerms;
    },
    onSuccess: () => {
      toast.success('Termos criados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['marketplaceTerms'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceTermsHistory'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar termos');
    },
  });
};

export const useAcceptMarketplaceTerms = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ itemId, termsId }: { itemId: string; termsId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!currentCompanyId) throw new Error('Company context not available');

      const { data, error } = await supabase
        .from('marketplace_terms_acceptances')
        .insert({
          company_id: currentCompanyId,
          user_id: user.id,
          item_id: itemId,
          terms_id: termsId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao aceitar termos');
    },
  });
};