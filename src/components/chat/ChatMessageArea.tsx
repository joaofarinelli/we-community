import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useMessages, useMessagesRealtime } from '@/hooks/useMessages';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ChatMessageAreaProps {
  conversationId: string | null;
  selectedConversation: any;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
  conversationId,
  selectedConversation
}) => {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  
  // Enable real-time updates
  useMessagesRealtime(conversationId);

  const inputRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(0);

  // Atualiza altura do input ao renderizar mensagens e ao redimensionar
  useEffect(() => {
    const updateHeight = () => {
      if (inputRef.current) {
        setInputHeight(inputRef.current.getBoundingClientRect().height);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Recalcula altura sempre que as mensagens mudam e rola para baixo
  useEffect(() => {
    if (inputRef.current) {
      setInputHeight(inputRef.current.getBoundingClientRect().height);
    }
    
    // Scroll para a última mensagem quando mensagens mudarem ou quando carregar inicialmente
    if (scrollAreaRef.current && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Use setTimeout para garantir que o DOM foi atualizado
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 50);
      }
    }
  }, [messages.length, messages]);

  // Scroll inicial quando a conversa é selecionada
  useEffect(() => {
    if (conversationId && scrollAreaRef.current && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [conversationId]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Selecione uma conversa</p>
          <p className="text-sm">Escolha uma conversa para começar a enviar mensagens</p>
        </div>
      </div>
    );
  }

  // If we have conversationId but no selectedConversation, show loading
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Carregando conversa...</p>
          <p className="text-sm">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  const otherUser = selectedConversation.otherParticipant;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {otherUser?.first_name?.[0] || '?'}
              {otherUser?.last_name?.[0] || ''}
            </span>
          </div>
          <div>
            <h3 className="font-medium">
              {otherUser?.first_name} {otherUser?.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {otherUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 min-h-0 p-4"
        style={{ paddingBottom: inputHeight }}
      >
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-xs space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem para começar a conversa</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input fixo */}
      <div ref={inputRef} className="p-4 border-t border-border bg-background sticky bottom-0 z-10">
        <ChatInput conversationId={conversationId} />
      </div>
    </div>
  );
};