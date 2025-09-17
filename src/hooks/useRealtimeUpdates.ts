import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { toast } from 'sonner';

type TableName = 'space_categories' | 'spaces' | 'posts';

interface RealtimeConfig {
  table: TableName;
  queryKeys: string[];
  filter?: string;
  showNotifications?: boolean;
}

export const useRealtimeUpdates = (configs: RealtimeConfig[]) => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  useEffect(() => {
    if (!currentCompanyId) return;

    const channels = configs.map((config) => {
      const channel = supabase
        .channel(`${config.table}-changes-${currentCompanyId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: config.table,
            filter: config.filter || `company_id=eq.${currentCompanyId}`,
          },
          (payload) => {
            console.log(`[Realtime] INSERT on ${config.table}:`, payload);
            
            if (config.showNotifications) {
              const entityName = getEntityName(config.table);
              toast.success(`Novo ${entityName} adicionado`, {
                description: 'A lista foi atualizada automaticamente.',
              });
            }
            
            config.queryKeys.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: config.table,
            filter: config.filter || `company_id=eq.${currentCompanyId}`,
          },
          (payload) => {
            console.log(`[Realtime] UPDATE on ${config.table}:`, payload);
            
            if (config.showNotifications) {
              const entityName = getEntityName(config.table);
              toast.info(`${entityName} atualizado`, {
                description: 'As informações foram atualizadas automaticamente.',
              });
            }
            
            config.queryKeys.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: config.table,
            filter: config.filter || `company_id=eq.${currentCompanyId}`,
          },
          (payload) => {
            console.log(`[Realtime] DELETE on ${config.table}:`, payload);
            
            if (config.showNotifications) {
              const entityName = getEntityName(config.table);
              toast.warning(`${entityName} removido`, {
                description: 'A lista foi atualizada automaticamente.',
              });
            }
            
            config.queryKeys.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
          }
        )
        .subscribe();

      return channel;
    });

    // Cleanup function
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [currentCompanyId, queryClient, configs]);
};

// Helper function to get entity name in Portuguese
const getEntityName = (table: TableName): string => {
  switch (table) {
    case 'space_categories':
      return 'categoria';
    case 'spaces':
      return 'espaço';
    case 'posts':
      return 'post';
    default:
      return 'item';
  }
};

// Hook específicos para cada página administrativa
export const useAdminCategoriesRealtime = () => {
  useRealtimeUpdates([
    {
      table: 'space_categories',
      queryKeys: ['spaceCategories', 'admin-categories'],
      showNotifications: true,
    },
  ]);
};

export const useAdminSpacesRealtime = () => {
  useRealtimeUpdates([
    {
      table: 'spaces',
      queryKeys: ['spaces', 'admin-spaces', 'userSpaces'],
      showNotifications: true,
    },
    {
      table: 'space_categories',
      queryKeys: ['spaceCategories', 'admin-categories'],
      showNotifications: false, // Categories already handled by useAdminCategoriesRealtime
    },
  ]);
};

export const useAdminPostsRealtime = () => {
  useRealtimeUpdates([
    {
      table: 'posts',
      queryKeys: ['admin-posts', 'spacePosts', 'posts'],
      showNotifications: true,
    },
  ]);
};