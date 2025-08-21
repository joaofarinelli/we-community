import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from './useCompanyContext';

interface InviteUserData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'admin' | 'member';
  courseAccess: string[];
}

export const useInviteUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (data: InviteUserData) => {
      const { data: result, error } = await supabase.functions.invoke('invite-user', {
        body: data,
        headers: {
          'x-company-id': currentCompanyId || ''
        }
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: "O convite foi enviado por email com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite.",
        variant: "destructive",
      });
    }
  });
};