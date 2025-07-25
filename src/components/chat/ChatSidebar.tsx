import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatConversationList } from './ChatConversationList';
import { ChatUserSearch } from './ChatUserSearch';

interface ChatSidebarProps {
  conversations: any[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, userId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.otherParticipant;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      otherUser?.first_name?.toLowerCase().includes(searchLower) ||
      otherUser?.last_name?.toLowerCase().includes(searchLower) ||
      otherUser?.email?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mensagens</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserSearch(!showUserSearch)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* User Search */}
      {showUserSearch && (
        <div className="p-4 border-b border-border bg-muted/20">
          <ChatUserSearch 
            onSelectUser={(userId, conversationId) => {
              setShowUserSearch(false);
              onSelectConversation(conversationId, userId);
            }}
          />
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <ChatConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
        />
      </ScrollArea>
    </div>
  );
};