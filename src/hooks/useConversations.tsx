import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(
            user_id,
            last_read_at,
            profiles!conversation_participants_user_id_fkey(
              user_id,
              first_name,
              last_name,
              email
            )
          ),
          messages(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Transform data to include other participant info for direct conversations
      return data?.map(conversation => {
        const otherParticipant = conversation.conversation_participants?.find(
          p => p.user_id !== user.id
        );
        
        const lastMessage = conversation.messages?.[conversation.messages.length - 1];

        return {
          ...conversation,
          otherParticipant: otherParticipant?.profiles,
          lastMessage,
          unreadCount: 0 // TODO: Calculate based on last_read_at
        };
      }) || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Use the database function to find or create conversation
      const { data, error } = await supabase.rpc('find_or_create_direct_conversation', {
        p_user1_id: user.id,
        p_user2_id: otherUserId,
        p_company_id: profile.company_id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};