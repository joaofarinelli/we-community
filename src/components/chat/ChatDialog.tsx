import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatUserProfile } from './ChatUserProfile';
import { useConversations } from '@/hooks/useConversations';

interface ChatDialogProps {
  children?: React.ReactNode;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({ children }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: conversations = [], refetch: refetchConversations } = useConversations();
  
  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  // Refetch conversations when a new conversation is selected to ensure it's in the list
  useEffect(() => {
    if (selectedConversationId && !selectedConversation) {
      console.log('🔄 Refetching conversations for missing conversation:', selectedConversationId);
      refetchConversations();
    }
  }, [selectedConversationId, selectedConversation, refetchConversations]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="relative">
            <MessageCircle className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            )}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] p-0 relative overflow-visible">
        {/* Div invisível para posicionar o botão de fechar fora da seção de chat */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 -right-8 pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-full relative">
          {/* Sidebar esquerda - Lista de conversas */}
          <div className="w-80 border-r border-border">
            <ChatSidebar 
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversationId, userId) => {
                console.log('🎬 ChatDialog selecting conversation:', { conversationId, userId });
                setSelectedConversationId(conversationId);
                setSelectedUserId(userId);
              }}
            />
          </div>

          {/* Área central - Mensagens */}
          <div className="flex-1 flex flex-col">
            <ChatMessageArea 
              conversationId={selectedConversationId}
              selectedConversation={selectedConversation}
            />
          </div>

          {/* Sidebar direita - Perfil do usuário */}
          {selectedUserId && (
            <div className="w-80 border-l border-border">
              <ChatUserProfile userId={selectedUserId} />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};