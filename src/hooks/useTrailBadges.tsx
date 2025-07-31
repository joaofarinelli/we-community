import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { useToast } from '@/hooks/use-toast';

// Interface baseada na estrutura real da tabela do Supabase
export interface TrailBadge {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  badge_type: string;
  icon_name?: string;
  icon_color?: string;
  background_color?: string;
  coins_reward?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
  color?: string;
  life_area?: string;
}

export const useTrailBadges = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['trail-badges', company?.id],
    queryFn: async () => {
      console.log('🎯 Fetching trail badges for company:', company?.id);
      if (!company?.id) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('trail_badges')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      console.log('🎯 Trail badges response:', { data, error });
      if (error) throw error;
      return data as TrailBadge[];
    },
    enabled: !!user && !!company?.id,
  });
};

export const useCreateTrailBadge = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeData: {
      name: string;
      description?: string;
      badge_type: string;
      icon_name?: string;
      icon_color?: string;
      background_color?: string;
      coins_reward?: number;
      is_active: boolean;
    }) => {
      if (!user || !company?.id) throw new Error('User or company not found');

      const insertData = {
        company_id: company.id,
        created_by: user.id,
        name: badgeData.name,
        description: badgeData.description,
        badge_type: badgeData.badge_type,
        icon_name: badgeData.icon_name || 'Award',
        icon_color: badgeData.icon_color || '#FFD700',
        background_color: badgeData.background_color || '#1E40AF',
        coins_reward: badgeData.coins_reward || 0,
        is_active: badgeData.is_active,
        color: badgeData.background_color || '#1E40AF', // Required field
        life_area: 'general', // Required field with default
      };

      const { data, error } = await supabase
        .from('trail_badges')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-badges', company?.id] });
      toast({
        title: 'Selo criado com sucesso',
        description: 'O selo da trilha foi criado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error creating trail badge:', error);
      toast({
        title: 'Erro ao criar selo',
        description: 'Ocorreu um erro ao criar o selo da trilha.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrailBadge = () => {
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...badgeData }: Partial<TrailBadge> & { id: string }) => {
      const updateData = {
        ...badgeData,
        color: badgeData.background_color || badgeData.color, // Ensure color field is set
      };

      const { data, error } = await supabase
        .from('trail_badges')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-badges', company?.id] });
      toast({
        title: 'Selo atualizado com sucesso',
        description: 'O selo da trilha foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating trail badge:', error);
      toast({
        title: 'Erro ao atualizar selo',
        description: 'Ocorreu um erro ao atualizar o selo da trilha.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTrailBadge = () => {
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from('trail_badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-badges', company?.id] });
      toast({
        title: 'Selo excluído com sucesso',
        description: 'O selo da trilha foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error deleting trail badge:', error);
      toast({
        title: 'Erro ao excluir selo',
        description: 'Ocorreu um erro ao excluir o selo da trilha.',
        variant: 'destructive',
      });
    },
  });
};