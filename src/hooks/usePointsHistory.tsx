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
    'undo_create_post': 'Post deletado',
    'undo_like_post': 'Curtida removida',
    'undo_comment_post': 'Comentário removido',
    'undo_receive_like': 'Curtida perdida',
    'undo_receive_comment': 'Comentário perdido',
    'transfer_sent': 'Transferência enviada',
    'transfer_received': 'Transferência recebida',
    'purchase_item': 'Compra no marketplace',
    'item_sold': 'Venda no marketplace',
    'challenge_reward': 'Recompensa de desafio',
    'lesson_complete': 'Aula concluída',
    'module_complete': 'Módulo concluído',
    'course_complete': 'Curso concluído',
    'lesson_like': 'Curtiu uma aula',
    'streak_milestone': 'Marco de sequência',
    'trail_badge': 'Selo de trilha conquistado',
    'trail_completion': 'Trilha concluída'
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