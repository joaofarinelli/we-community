import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatConversationListProps {
  conversations: any[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, userId: string) => void;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation
}) => {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Nenhuma conversa encontrada</p>
        <p className="text-sm mt-1">Clique no + para iniciar uma nova conversa</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        const otherUser = conversation.otherParticipant;
        const isSelected = conversation.id === selectedConversationId;
        
        return (
          <div
            key={conversation.id}
            className={cn(
              "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
              isSelected && "bg-muted"
            )}
            onClick={() => onSelectConversation(conversation.id, otherUser?.user_id)}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {otherUser?.first_name?.[0] || '?'}
                  {otherUser?.last_name?.[0] || ''}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium truncate">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {conversation.lastMessage?.content || 'Iniciar conversa...'}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {otherUser?.email}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};