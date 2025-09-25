import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export interface SpaceAccessRule {
  id: string;
  space_id: string;
  company_id: string;
  rule_name: string;
  rule_type: 'create_posts' | 'edit_posts' | 'delete_posts' | 'view_space';
  tag_ids: string[];
  level_ids: string[];
  badge_ids: string[];
  user_roles: string[];
  criteria_logic: 'any' | 'all';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SpaceAccessRuleInput {
  rule_name: string;
  rule_type: 'create_posts' | 'edit_posts' | 'delete_posts' | 'view_space';
  tag_ids: string[];
  level_ids: string[];
  badge_ids: string[];
  user_roles: string[];
  criteria_logic: 'any' | 'all';
}

export const useSpaceAccessRules = (spaceId: string) => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['spaceAccessRules', spaceId, company?.id],
    queryFn: async () => {
      if (!user || !company?.id || !spaceId) return [];

      const { data, error } = await supabase
        .from('space_access_rules')
        .select('*')
        .eq('space_id', spaceId)
        .eq('company_id', company.id)
        .order('rule_type');

      if (error) {
        console.error('Error fetching space access rules:', error);
        throw error;
      }

      return (data as SpaceAccessRule[]) || [];
    },
    enabled: !!user && !!company?.id && !!spaceId,
  });
};

export const useCreateSpaceAccessRule = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      spaceId, 
      ruleData 
    }: { 
      spaceId: string; 
      ruleData: SpaceAccessRuleInput;
    }) => {
      if (!user || !company?.id) {
        throw new Error('Usuário não encontrado');
      }

      const { data, error } = await supabase
        .from('space_access_rules')
        .insert({
          space_id: spaceId,
          company_id: company.id,
          created_by: user.id,
          ...ruleData,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SpaceAccessRule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['spaceAccessRules', data.space_id] 
      });
      toast.success('Regra de acesso criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar regra de acesso:', error);
      toast.error('Erro ao criar regra de acesso. Tente novamente.');
    },
  });
};

export const useUpdateSpaceAccessRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ruleId, 
      ruleData 
    }: { 
      ruleId: string; 
      ruleData: Partial<SpaceAccessRuleInput>;
    }) => {
      const { data, error } = await supabase
        .from('space_access_rules')
        .update(ruleData)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;
      return data as SpaceAccessRule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['spaceAccessRules', data.space_id] 
      });
      toast.success('Regra de acesso atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar regra de acesso:', error);
      toast.error('Erro ao atualizar regra de acesso. Tente novamente.');
    },
  });
};

export const useDeleteSpaceAccessRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('space_access_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return ruleId;
    },
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: ['spaceAccessRules'] });
      toast.success('Regra de acesso removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover regra de acesso:', error);
      toast.error('Erro ao remover regra de acesso. Tente novamente.');
    },
  });
};

export const useCheckSpaceAccess = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({ 
      spaceId, 
      ruleType 
    }: { 
      spaceId: string; 
      ruleType: string;
    }) => {
      if (!user || !company?.id) return false;

      const { data, error } = await supabase
        .rpc('check_space_access_rule', {
          p_space_id: spaceId,
          p_user_id: user.id,
          p_rule_type: ruleType,
        });

      if (error) {
        console.error('Error checking space access:', error);
        return false;
      }

      return data as boolean;
    },
  });
};