import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageArea } from './ChatMessageArea';
import { ChatUserProfile } from './ChatUserProfile';
import { useConversations } from '@/hooks/useConversations';

export const ChatDialog: React.FC = ({ children }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string|null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string|null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: conversations = [], refetch } = useConversations();

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount||0), 0);
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  useEffect(()=>{
    if (selectedConversationId && !selectedConversation) refetch();
  },[selectedConversationId, selectedConversation, refetch]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm" className="relative">
            <MessageCircle className="h-5 w-5" />
            {totalUnread > 0 && (
              <Badge className="absolute -top-2 -right-2" variant="destructive">
                {totalUnread>99?'99+':totalUnread}
              </Badge>
            )}
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent
        className="
          relative
          h-[90vh]
          max-w-[80vw]    /* largura fixa menor que 100% */
          p-0
          bg-background   /* fundo do painel */
          overflow-visible
        "
      >
        {/* botón de fechar usando DrawerClose */}
        <DrawerClose asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="
              absolute
              top-4
              -right-8      /* joga 2rem pra fora do painel */
              z-20
              bg-background/80
              backdrop-blur-sm
              hover:bg-background/90
            "
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerClose>

        <div className="flex h-full">
          <div className="w-80 border-r border-border">
            <ChatSidebar
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(cid, uid) => {
                setSelectedConversationId(cid);
                setSelectedUserId(uid);
              }}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <ChatMessageArea
              conversationId={selectedConversationId}
              selectedConversation={selectedConversation}
            />
          </div>

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