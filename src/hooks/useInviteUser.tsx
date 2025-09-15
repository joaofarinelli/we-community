import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from './useCompanyContext';
import { useAuth } from './useAuth';

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
  const { session, user } = useAuth();

  return useMutation({
    mutationFn: async (data: InviteUserData) => {
      // Check if user is authenticated
      if (!session?.access_token || !user) {
        throw new Error('Você precisa estar logado para enviar convites');
      }

      // Check if user has admin/owner role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .single();

      if (!profile || !['admin', 'owner'].includes(profile.role)) {
        throw new Error('Você não tem permissão para enviar convites');
      }

      const { data: result, error } = await supabase.functions.invoke('invite-user', {
        body: data,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
      console.error('Invite user error:', error);
      
      let errorMessage = "Ocorreu um erro ao enviar o convite.";
      if (error.message?.includes('logado')) {
        errorMessage = error.message;
      } else if (error.message?.includes('permissão')) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao enviar convite",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
};