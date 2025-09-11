import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export interface TMBProduct {
  id: string;
  company_id: string;
  tmb_product_id: string;
  name: string;
  description?: string;
  price_brl?: number;
  price_coins?: number;
  category?: string;
  image_url?: string;
  stock_quantity?: number;
  is_active: boolean;
  tmb_data?: any;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UseTMBProductsProps {
  category?: string;
  search?: string;
  isActive?: boolean;
}

export const useTMBProducts = (filters: UseTMBProductsProps = {}) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['tmbProducts', currentCompanyId, filters],
    queryFn: async () => {
      if (!currentCompanyId) {
        throw new Error('Contexto da empresa não disponível');
      }

      let query = supabase
        .from('tmb_products')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('name');

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TMBProduct[] || [];
    },
    enabled: !!currentCompanyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useTMBProductCategories = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['tmbProductCategories', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) {
        throw new Error('Contexto da empresa não disponível');
      }

      const { data, error } = await supabase
        .from('tmb_products')
        .select('category')
        .eq('company_id', currentCompanyId)
        .not('category', 'is', null);

      if (error) throw error;

      // Extrair categorias únicas
      const categories = Array.from(new Set(data?.map(item => item.category).filter(Boolean) || []));
      return categories as string[];
    },
    enabled: !!currentCompanyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};