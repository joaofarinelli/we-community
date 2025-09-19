import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';

/**
 * Hook que monitora mudanças de contexto da empresa e limpa o cache
 * Previne vazamento de dados entre empresas diferentes
 */
export const useCompanyContextWatcher = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();
  const previousCompanyIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Se é a primeira vez carregando ou não há empresa selecionada
    if (!currentCompanyId) {
      console.log('🔧 CompanyContextWatcher: No company selected, clearing all cache');
      queryClient.clear();
      previousCompanyIdRef.current = null;
      return;
    }

    // Se mudou de empresa, limpar cache da empresa anterior
    if (previousCompanyIdRef.current && previousCompanyIdRef.current !== currentCompanyId) {
      console.log('🔄 CompanyContextWatcher: Company changed from', previousCompanyIdRef.current, 'to', currentCompanyId, '- clearing old cache');
      
      // Remover todas as queries da empresa anterior
      queryClient.removeQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && 
                 queryKey.length > 1 && 
                 queryKey[1] === previousCompanyIdRef.current;
        }
      });

      // Invalidar queries genéricas que podem ter dados da empresa anterior
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Invalidate queries sem company ID que podem conter dados antigos
          return Array.isArray(queryKey) && 
                 queryKey.length === 1 && 
                 ['company', 'userProfile', 'spaces', 'posts', 'courses'].includes(queryKey[0] as string);
        }
      });
    }

    // Atualizar a referência da empresa atual
    if (currentCompanyId !== previousCompanyIdRef.current) {
      console.log('✅ CompanyContextWatcher: Company context established:', currentCompanyId);
      previousCompanyIdRef.current = currentCompanyId;
    }
  }, [currentCompanyId, queryClient]);

  return { currentCompanyId, isWatching: true };
};