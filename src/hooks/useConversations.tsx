import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID, returning empty conversations');
        return [];
      }

      console.log('🔍 Fetching conversations for user:', user.id);

      // Step 1: Get conversations where user is a participant
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

      // Step 2: Get conversation data
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        throw error;
      }

      if (!conversations || conversations.length === 0) {
        console.log('📭 No conversations found');
        return [];
      }

      // Step 3: Get all participants for these conversations
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, last_read_at')
        .in('conversation_id', conversationIds);

      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError);
        throw participantsError;
      }

      // Step 4: Get unique user IDs for profiles
      const userIds = [...new Set(participants?.map(p => p.user_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Step 5: Build conversations with messages
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conversation) => {
          // Get last message for this conversation
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Find participants for this conversation
          const conversationParticipants = participants?.filter(
            p => p.conversation_id === conversation.id
          ) || [];

          // Find the other participant (not the current user)
          const otherParticipant = conversationParticipants.find(
            p => p.user_id !== user.id
          );

          // Find profile for the other participant
          const otherProfile = otherParticipant 
            ? profiles?.find(p => p.user_id === otherParticipant.user_id)
            : null;
          
          const lastMessage = messages?.[0];

          const transformedConversation = {
            ...conversation,
            conversation_participants: conversationParticipants.map(p => ({
              ...p,
              profiles: profiles?.find(prof => prof.user_id === p.user_id)
            })),
            otherParticipant: otherProfile,
            lastMessage,
            unreadCount: 0 // TODO: Calculate based on last_read_at
          };

          console.log('🔄 Transformed conversation:', {
            id: conversation.id,
            otherParticipant: otherProfile,
            lastMessage: lastMessage?.content,
            participantsCount: conversationParticipants.length
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