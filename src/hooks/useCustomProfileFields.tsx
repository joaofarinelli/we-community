import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export type CustomFieldType = 'text' | 'textarea' | 'select' | 'number' | 'date';

export interface CustomProfileField {
  id: string;
  company_id: string;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  field_options: any;
  is_required: boolean;
  is_active: boolean;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserCustomProfileData {
  id: string;
  user_id: string;
  company_id: string;
  field_id: string;
  field_value: string | null;
  created_at: string;
  updated_at: string;
}

export const useCustomProfileFields = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['custom-profile-fields', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('custom_profile_fields')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useUserCustomProfileData = (userId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-custom-profile-data', targetUserId, currentCompanyId],
    queryFn: async () => {
      if (!targetUserId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('user_custom_profile_data')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId && !!currentCompanyId,
  });
};

export const useCreateCustomProfileField = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (fieldData: {
      field_name: string;
      field_label: string;
      field_type: CustomFieldType;
      field_options?: any;
      is_required?: boolean;
      order_index: number;
    }) => {
      if (!user?.id || !currentCompanyId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('custom_profile_fields')
        .insert({
          ...fieldData,
          company_id: currentCompanyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-profile-fields'] });
      toast.success('Campo personalizado criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar campo: ' + error.message);
    },
  });
};

export const useUpdateCustomProfileField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CustomProfileField>) => {
      const { data, error } = await supabase
        .from('custom_profile_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-profile-fields'] });
      toast.success('Campo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar campo: ' + error.message);
    },
  });
};

export const useDeleteCustomProfileField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_profile_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-profile-fields'] });
      toast.success('Campo excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir campo: ' + error.message);
    },
  });
};

export const useUpdateUserCustomProfileData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (updates: Array<{ field_id: string; field_value: string | null }>) => {
      if (!user?.id || !currentCompanyId) throw new Error('User not authenticated');

      const operations = updates.map(({ field_id, field_value }) =>
        supabase
          .from('user_custom_profile_data')
          .upsert({
            field_id,
            field_value,
            user_id: user.id,
            company_id: currentCompanyId,
          })
      );

      const results = await Promise.all(operations);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-custom-profile-data'] });
      toast.success('Dados personalizados atualizados!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar dados: ' + error.message);
    },
  });
};