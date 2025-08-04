import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Hook centralizado para gerenciar atualizações em tempo real dos posts
export const useRealtimePosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up global realtime subscriptions for posts');
    
    const channel = supabase
      .channel('global-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Global posts realtime update:', payload);
          
          // Invalidate all post-related queries
          queryClient.invalidateQueries({ queryKey: ['allPosts'] });
          queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
          
          // If it's a new post, also invalidate user posts
          if (payload.eventType === 'INSERT') {
            queryClient.invalidateQueries({ queryKey: ['userPosts'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all post interactions changes
          schema: 'public',
          table: 'post_interactions'
        },
        (payload) => {
          console.log('Global post interactions realtime update:', payload);
          
          // Invalidate interaction and post queries
          queryClient.invalidateQueries({ queryKey: ['postInteractions'] });
          queryClient.invalidateQueries({ queryKey: ['allPosts'] });
          queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
          
          // Also invalidate points/coins if it's a like or comment
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            queryClient.invalidateQueries({ queryKey: ['userCoins'] });
            queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up global realtime subscriptions for posts');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};