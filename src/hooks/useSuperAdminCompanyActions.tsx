import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreateCompanyData {
  name: string;
  subdomain?: string;
  custom_domain?: string;
  plan: string;
  status: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  cnpj?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  id: string;
}

export const useSuperAdminCompanyActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const { data: result, error } = await supabase
        .from('companies')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-metrics"] });
      toast({
        title: "Empresa criada com sucesso",
        description: "A nova empresa foi adicionada ao sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar empresa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-metrics"] });
      toast({
        title: "Empresa atualizada",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCompanyStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { data: result, error } = await supabase
        .from('companies')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-metrics"] });
      toast({
        title: `Empresa ${variables.status === 'active' ? 'ativada' : 'desativada'}`,
        description: `A empresa foi ${variables.status === 'active' ? 'ativada' : 'desativada'} com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-metrics"] });
      toast({
        title: "Empresa removida",
        description: "A empresa foi removida do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover empresa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createCompany,
    updateCompany,
    toggleCompanyStatus,
    deleteCompany,
  };
};