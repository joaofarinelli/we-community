import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useEffect } from 'react';
export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId || !user?.id) {
        console.log('❌ useMessages: Missing conversationId or user:', { conversationId, userId: user?.id });
        return [];
      }

      console.log('📨 Fetching messages for conversation:', conversationId);

      // First get the messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        throw error;
      }

      if (!messages || messages.length === 0) {
        console.log('✅ No messages found');
        return [];
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      
      // Fetch profiles for all senders
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', senderIds)
        .eq('company_id', currentCompanyId);
      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        // Return messages without profile data if profiles fetch fails
        return messages;
      }

      // Map profiles to messages
      const messagesWithProfiles = messages.map(message => ({
        ...message,
        profiles: profiles?.find(p => p.user_id === message.sender_id) || null
      }));
      
      console.log('✅ Messages with profiles fetched:', messagesWithProfiles.length);
      return messagesWithProfiles;
    },
    enabled: !!conversationId && !!user?.id && !!currentCompanyId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      attachmentUrl, 
      attachmentName, 
      attachmentType 
    }: { 
      conversationId: string; 
      content: string;
      attachmentUrl?: string | null;
      attachmentName?: string | null;
      attachmentType?: 'image' | 'document' | null;
    }) => {
      if (!user) throw new Error('User not authenticated');

      if (!currentCompanyId) throw new Error('Company context not set');

      const messageType = attachmentUrl ? (attachmentType === 'image' ? 'image' : 'file') : 'text';

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          company_id: currentCompanyId,
          content,
          message_type: messageType,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useMessagesRealtime = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, queryClient]);
};