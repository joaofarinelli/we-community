import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

interface CreateLevelData {
  level_name: string;
  min_coins_required: number;
  max_coins_required?: number;
  level_color: string;
  level_icon: string;
}

interface UpdateLevelData extends CreateLevelData {
  id: string;
}

export const useManageLevels = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const createLevel = useMutation({
    mutationFn: async (levelData: CreateLevelData) => {
      if (!user) throw new Error('User not authenticated');
      if (!currentCompanyId) throw new Error('Company context not found');

      console.log('createLevel: Creating level for company', currentCompanyId, levelData);

      // Get the highest level number to set the new one
      const { data: existingLevels } = await supabase
        .from('user_levels')
        .select('level_number')
        .eq('company_id', currentCompanyId)
        .order('level_number', { ascending: false })
        .limit(1);

      const nextLevelNumber = (existingLevels?.[0]?.level_number || 0) + 1;

      const { data, error } = await supabase
        .from('user_levels')
        .insert({
          ...levelData,
          level_number: nextLevelNumber,
          company_id: currentCompanyId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyLevels', currentCompanyId] });
      toast.success('Nível criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar nível: ' + error.message);
    }
  });

  const updateLevel = useMutation({
    mutationFn: async (levelData: UpdateLevelData) => {
      const { id, ...updateData } = levelData;
      
      const { data, error } = await supabase
        .from('user_levels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyLevels', currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['userLevel'] });
      toast.success('Nível atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar nível: ' + error.message);
    }
  });

  const deleteLevel = useMutation({
    mutationFn: async (levelId: string) => {
      const { error } = await supabase
        .from('user_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyLevels', currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['userLevel'] });
      toast.success('Nível removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover nível: ' + error.message);
    }
  });

  return {
    createLevel,
    updateLevel,
    deleteLevel
  };
};