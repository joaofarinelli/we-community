import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';
import type { CreateSpaceFormData } from '@/lib/schemas';
import type { SpaceType } from '@/lib/spaceUtils';

export const useCreateSpace = () => {
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SpaceType | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const createSpaceMutation = useMutation({
    mutationFn: async (data: CreateSpaceFormData) => {
      if (!user || !company) {
        throw new Error('Usuário ou empresa não encontrados');
      }

      // Buscar próximo order_index
      const { data: existingSpaces } = await supabase
        .from('spaces')
        .select('order_index')
        .eq('category_id', data.categoryId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSpaces?.[0]?.order_index ? existingSpaces[0].order_index + 1 : 0;

      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert({
          name: data.name,
          type: data.type,
          category_id: data.categoryId,
          company_id: company.id,
          created_by: user.id,
          order_index: nextOrderIndex,
          is_private: data.accessLevel !== 'open',
          custom_icon_type: data.customIconType || 'default',
          custom_icon_value: data.customIconValue || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newSpace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Espaço criado com sucesso!');
      closeAllDialogs();
    },
    onError: (error) => {
      console.error('Erro ao criar espaço:', error);
      toast.error('Erro ao criar espaço. Tente novamente.');
    },
  });

  const openTypeSelection = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsTypeSelectionOpen(true);
  };

  const selectTypeAndProceed = (type: SpaceType) => {
    setSelectedType(type);
    setIsTypeSelectionOpen(false);
    setIsConfigurationOpen(true);
  };

  const closeAllDialogs = () => {
    setIsTypeSelectionOpen(false);
    setIsConfigurationOpen(false);
    setSelectedType(null);
    setSelectedCategoryId(null);
  };

  const createSpace = (configData: CreateSpaceFormData) => {
    if (!selectedType) return;
    
    createSpaceMutation.mutate({
      ...configData,
      type: selectedType,
    });
  };

  return {
    isTypeSelectionOpen,
    isConfigurationOpen,
    selectedType,
    selectedCategoryId,
    isCreating: createSpaceMutation.isPending,
    openTypeSelection,
    selectTypeAndProceed,
    closeAllDialogs,
    createSpace,
  };
};