import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useSendMessage } from '@/hooks/useMessages';
import { useToast } from '@/components/ui/use-toast';

interface ChatInputProps {
  conversationId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim()
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1">
        <Textarea
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="min-h-[40px] max-h-32 resize-none"
          disabled={sendMessage.isPending}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!message.trim() || sendMessage.isPending}
        size="sm"
        className="h-10 w-10 p-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};