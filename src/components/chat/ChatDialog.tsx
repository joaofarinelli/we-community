import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
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
  
  const { data: conversations = [] } = useConversations();
  
  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
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
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-6xl p-0 sm:max-w-6xl">
        <div className="flex h-full">
          {/* Sidebar esquerda - Lista de conversas */}
          <div className="w-80 border-r border-border">
            <ChatSidebar 
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversationId, userId) => {
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
      </SheetContent>
    </Sheet>
  );
};