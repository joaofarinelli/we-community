import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

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
  is_public: boolean;
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fieldData: {
      field_name: string;
      field_label: string;
      field_type: CustomFieldType;
      field_options?: any;
      is_required?: boolean;
      is_public?: boolean;
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
      toast({
        title: 'Sucesso',
        description: 'Campo personalizado criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar campo: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCustomProfileField = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Sucesso',
        description: 'Campo atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar campo: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCustomProfileField = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: 'Sucesso',
        description: 'Campo excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir campo: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useOtherUserCustomProfileData = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['other-user-custom-profile-data', userId, currentCompanyId],
    queryFn: async () => {
      if (!userId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('user_custom_profile_data')
        .select(`
          *,
          custom_profile_fields (
            id,
            field_name,
            field_label,
            field_type,
            field_options,
            is_public
          )
        `)
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!currentCompanyId,
  });
};

export const useUpdateUserCustomProfileData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Array<{ field_id: string; field_value: string | null }>) => {
      if (!user?.id || !currentCompanyId) throw new Error('User not authenticated');

      // Prepare upsert data with all required fields for unique constraint
      const upsertData = updates.map(({ field_id, field_value }) => ({
        field_id,
        field_value,
        user_id: user.id,
        company_id: currentCompanyId,
      }));

      // Use a single upsert operation with conflict resolution
      const { data, error } = await supabase
        .from('user_custom_profile_data')
        .upsert(upsertData, {
          onConflict: 'user_id,company_id,field_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-custom-profile-data'] });
      queryClient.invalidateQueries({ queryKey: ['other-user-custom-profile-data'] });
      toast({
        title: 'Sucesso',
        description: 'Dados personalizados atualizados!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar dados: ' + error.message,
        variant: 'destructive',
      });
    },
  });
};