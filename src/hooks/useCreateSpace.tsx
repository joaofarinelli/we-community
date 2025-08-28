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

      // Verificar se há uma sessão válida antes de prosseguir
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Sessão de autenticação inválida. Faça login novamente.');
      }

      console.log('🔧 Criando espaço - Contexto atual:', { 
        userId: user.id, 
        companyId: company.id,
        companyName: company.name
      });

      // CRÍTICO: Para usuários multi-empresa, SEMPRE redefinir o contexto antes de operações importantes
      const { error: contextError } = await supabase.rpc('set_current_company_context', {
        p_company_id: company.id
      });

      if (contextError) {
        console.error('Erro ao definir contexto da empresa:', contextError);
        throw new Error(`Erro ao definir contexto da empresa: ${contextError.message}`);
      }

      // Debug: Verificar o contexto atual antes de criar o espaço
      const { data: debugInfo, error: debugError } = await supabase.rpc('debug_space_creation_context');
      console.log('🔍 Debug do contexto de criação:', debugInfo?.[0]);
      
      if (debugError) {
        console.error('Erro no debug:', debugError);
      }

      if (!debugInfo?.[0]?.auth_user_id) {
        throw new Error('Usuário não autenticado no contexto do banco de dados');
      }

      if (!debugInfo?.[0]?.company_context) {
        throw new Error('Contexto da empresa não foi definido corretamente');
      }

      if (!debugInfo?.[0]?.is_owner) {
        throw new Error(`Usuário não é proprietário da empresa atual. Debug: ${JSON.stringify(debugInfo[0])}`);
      }

      // Aguardar um momento para o contexto se propagar
      await new Promise(resolve => setTimeout(resolve, 100));

      // Buscar próximo order_index
      const { data: existingSpaces } = await supabase
        .from('spaces')
        .select('order_index')
        .eq('category_id', data.categoryId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSpaces?.[0]?.order_index ? existingSpaces[0].order_index + 1 : 0;

      const spaceData = {
        name: data.name,
        type: data.type,
        category_id: data.categoryId,
        company_id: company.id,
        created_by: user.id,
        order_index: nextOrderIndex,
        visibility: data.visibility,
        custom_icon_type: data.customIconType || 'default',
        custom_icon_value: data.customIconValue || null,
      };

      console.log('🔧 Dados do espaço a serem inseridos:', spaceData);

      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert(spaceData)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao criar espaço:', error);
        throw new Error(`Erro ao criar espaço: ${error.message}. Code: ${error.code}`);
      }
      
      console.log('✅ Espaço criado com sucesso:', newSpace);
      return newSpace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Espaço criado com sucesso!');
      closeAllDialogs();
    },
    onError: (error) => {
      console.error('Erro ao criar espaço:', error);
      
      // Dar mensagens de erro mais específicas para o usuário
      if (error.message.includes('Sessão de autenticação inválida')) {
        toast.error('Sessão expirada. Recarregue a página e tente novamente.');
      } else if (error.message.includes('contexto da empresa')) {
        toast.error('Erro de contexto. Selecione novamente a empresa e tente novamente.');
      } else if (error.message.includes('row-level security policy')) {
        toast.error('Erro de permissão. Verifique se você tem permissão para criar espaços.');
      } else {
        toast.error(`Erro ao criar espaço: ${error.message}`);
      }
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