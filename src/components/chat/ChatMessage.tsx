import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessageProps {
  message: any;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;
  const sender = message.profiles;

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-xs lg:max-w-md", isOwn ? "order-2" : "order-1")}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {sender?.first_name?.[0] || '?'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {sender?.first_name} {sender?.last_name}
            </span>
          </div>
        )}
        
        <div
          className={cn(
            "px-4 py-2 rounded-lg text-sm",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        
        <div className={cn("mt-1 text-xs text-muted-foreground", isOwn ? "text-right" : "text-left")}>
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </div>
      </div>
    </div>
  );
};