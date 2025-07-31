import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePointsHistory = (userId?: string, limit: number = 20) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['pointsHistory', targetUserId, limit],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });
};

export const getActionTypeLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    'create_post': 'Criou um post',
    'like_post': 'Curtiu um post',
    'comment_post': 'Comentou em um post',
    'receive_like': 'Recebeu uma curtida',
    'receive_comment': 'Recebeu um comentário',
    'undo_create_post': 'Desfez criação de post',
    'undo_like_post': 'Removeu curtida de post',
    'undo_comment_post': 'Removeu comentário de post',
    'undo_receive_like': 'Perdeu uma curtida',
    'undo_receive_comment': 'Perdeu um comentário'
  };
  
  return labels[actionType] || actionType;
};

export const getActionTypeIcon = (actionType: string): string => {
  const icons: Record<string, string> = {
    'create_post': '📝',
    'like_post': '👍',
    'comment_post': '💬',
    'receive_like': '❤️',
    'receive_comment': '💭',
    'undo_create_post': '🗑️',
    'undo_like_post': '👎',
    'undo_comment_post': '💬',
    'undo_receive_like': '💔',
    'undo_receive_comment': '😞'
  };
  
  return icons[actionType] || '⭐';
};