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
          {message.message_type === 'image' && message.attachment_url ? (
            <div className="space-y-2">
              <img 
                src={message.attachment_url} 
                alt={message.attachment_name || 'Imagem'} 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.attachment_url, '_blank')}
              />
              {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
            </div>
          ) : message.message_type === 'file' && message.attachment_url ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-background/10 rounded border">
                <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.attachment_name}</p>
                  <button 
                    onClick={() => window.open(message.attachment_url, '_blank')}
                    className="text-xs underline hover:no-underline"
                  >
                    Baixar arquivo
                  </button>
                </div>
              </div>
              {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
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