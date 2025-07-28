import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🔍 Fetching conversations for user:', user.id);

      // First, get conversations where user is a participant
      const { data: userConversations, error: conversationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (conversationError) {
        console.error('❌ Error fetching user conversations:', conversationError);
        throw conversationError;
      }

      if (!userConversations || userConversations.length === 0) {
        console.log('📭 No conversations found for user');
        return [];
      }

      const conversationIds = userConversations.map(uc => uc.conversation_id);
      console.log('🔗 Found conversation IDs:', conversationIds);

      // Now get full conversation data
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants(
            user_id,
            last_read_at,
            profiles(
              user_id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        throw error;
      }

      console.log('📋 Raw conversations data:', conversations);

      if (!conversations || conversations.length === 0) {
        console.log('📭 No conversations found');
        return [];
      }

      // Fetch messages for each conversation separately
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conversation) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const otherParticipant = conversation.conversation_participants?.find(
            p => p.user_id !== user.id
          );
          
          const lastMessage = messages?.[0];

          const transformedConversation = {
            ...conversation,
            otherParticipant: otherParticipant?.profiles,
            lastMessage,
            unreadCount: 0 // TODO: Calculate based on last_read_at
          };

          console.log('🔄 Transformed conversation:', {
            id: conversation.id,
            otherParticipant: otherParticipant?.profiles,
            lastMessage: lastMessage?.content,
            participantsCount: conversation.conversation_participants?.length
          });

          return transformedConversation;
        })
      );

      console.log('✅ Final conversations:', conversationsWithMessages);
      return conversationsWithMessages;
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
    onSuccess: (data) => {
      console.log('🔄 Invalidating conversations queries after conversation creation');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      return data;
    },
  });
};