import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useUpdateCompany = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; [key: string]: any }) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: updatedCompany, error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', data.id)
        .eq('id', currentCompanyId) // Ensure user can only update their current company
        .select()
        .single();

      if (error) throw error;
      return updatedCompany;
    },
    onSuccess: () => {
      // Invalidate company queries
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      console.error('Error updating company:', error);
      toast.error('Erro ao atualizar empresa');
    }
  });
};