import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';
import { useEffect } from 'react';

/**
 * Hook para garantir que todas as queries sejam específicas por empresa
 * e limpar cache quando necessário
 */
export const useCompanySpecificQueries = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  // Monitor para debugging - mostrar queries ativas e possíveis problemas
  useEffect(() => {
    if (!currentCompanyId) return;

    const debugInterval = setInterval(() => {
      const allQueries = queryClient.getQueryCache().getAll();
      const companyQueries = allQueries.filter(query => 
        Array.isArray(query.queryKey) && query.queryKey[1] === currentCompanyId
      );
      const genericQueries = allQueries.filter(query =>
        Array.isArray(query.queryKey) && 
        query.queryKey.length === 1 &&
        ['spaces', 'posts', 'courses', 'company', 'userProfile'].includes(query.queryKey[0] as string)
      );

      if (genericQueries.length > 0) {
        console.warn('⚠️ Found generic queries without companyId:', 
          genericQueries.map(q => q.queryKey)
        );
      }

      console.log('📊 Query stats:', {
        total: allQueries.length,
        companySpecific: companyQueries.length,
        problematicGeneric: genericQueries.length,
        currentCompanyId
      });
    }, 60000); // Check every minute

    return () => clearInterval(debugInterval);
  }, [currentCompanyId, queryClient]);

  // Função para limpar todas as queries genéricas que podem estar "vazando" dados
  const clearGenericQueries = () => {
    console.log('🧹 Clearing potentially problematic generic queries');
    
    const problematicKeys = [
      'spaces', 'posts', 'courses', 'company', 'userProfile', 
      'spaceCategories', 'segments', 'access-groups', 'notifications',
      'challenges', 'events', 'bulk-actions'
    ];

    problematicKeys.forEach(key => {
      queryClient.removeQueries({ queryKey: [key] });
    });
  };

  return {
    currentCompanyId,
    clearGenericQueries,
  };
};