import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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
  const queryClient = useQueryClient();

  const createLevel = useMutation({
    mutationFn: async (levelData: CreateLevelData) => {
      if (!user) throw new Error('User not authenticated');

      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('User company not found');

      // Get the highest level number to set the new one
      const { data: existingLevels } = await supabase
        .from('user_levels')
        .select('level_number')
        .eq('company_id', profile.company_id)
        .order('level_number', { ascending: false })
        .limit(1);

      const nextLevelNumber = (existingLevels?.[0]?.level_number || 0) + 1;

      const { data, error } = await supabase
        .from('user_levels')
        .insert({
          ...levelData,
          level_number: nextLevelNumber,
          company_id: profile.company_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyLevels'] });
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
      queryClient.invalidateQueries({ queryKey: ['companyLevels'] });
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
      queryClient.invalidateQueries({ queryKey: ['companyLevels'] });
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