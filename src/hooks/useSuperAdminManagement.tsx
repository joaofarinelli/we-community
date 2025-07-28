import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SuperAdminResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const useSuperAdmins = () => {
  return useQuery({
    queryKey: ["super-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SuperAdmin[];
    },
    enabled: false, // Only enable when super admin is confirmed
  });
};

export const useAddSuperAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (email: string) => {
      // First, check if user exists in auth.users by trying to get their ID
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !existingUser) {
        throw new Error('Usuário não encontrado com este email');
      }

      // Check if already a super admin
      const { data: existingSuperAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', existingUser.user_id)
        .eq('is_active', true)
        .single();

      if (existingSuperAdmin) {
        throw new Error('Usuário já é um super admin');
      }

      // Add as super admin
      const { error } = await supabase
        .from('super_admins')
        .insert({
          user_id: existingUser.user_id,
          email: email.toLowerCase(),
        });

      if (error) throw error;
      
      return { success: true, message: 'Super admin adicionado com sucesso' };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["super-admins"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar super admin");
    }
  });
};

export const useRemoveSuperAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Get current user to prevent self-removal
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id === userId) {
        throw new Error('Você não pode remover a si mesmo como super admin');
      }

      // Remove super admin (set inactive)
      const { error } = await supabase
        .from('super_admins')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
      
      return { success: true, message: 'Super admin removido com sucesso' };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["super-admins"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover super admin");
    }
  });
};