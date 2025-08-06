import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Link2 } from 'lucide-react';
import { useSendMessage } from '@/hooks/useMessages';
import { useToast } from '@/components/ui/use-toast';
import { ChatAttachmentButton } from './ChatAttachmentButton';
import { EditorEmojiPicker } from '@/components/posts/EditorEmojiPicker';

interface ChatInputProps {
  conversationId: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | null>(null);
  const { toast } = useToast();
  
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!message.trim() && !attachmentUrl) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim() || (attachmentUrl ? `Anexo: ${attachmentName}` : ''),
        attachmentUrl,
        attachmentName,
        attachmentType
      });
      setMessage('');
      setAttachmentUrl(null);
      setAttachmentName(null);
      setAttachmentType(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentUpload = (url: string, name: string, type: 'image' | 'document') => {
    setAttachmentUrl(url);
    setAttachmentName(name);
    setAttachmentType(type);
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName(null);
    setAttachmentType(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <div className="space-y-2">
      {attachmentUrl && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="flex items-center space-x-2">
            {attachmentType === 'image' ? (
              <img src={attachmentUrl} alt={attachmentName} className="w-8 h-8 object-cover rounded" />
            ) : (
              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                📄
              </div>
            )}
            <span className="text-sm text-muted-foreground">{attachmentName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeAttachment}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="flex space-x-1">
          <ChatAttachmentButton 
            type="image" 
            onAttachmentUpload={handleAttachmentUpload}
          />
          <ChatAttachmentButton 
            type="document" 
            onAttachmentUpload={handleAttachmentUpload}
          />
          <EditorEmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
        
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
          disabled={(!message.trim() && !attachmentUrl) || sendMessage.isPending}
          size="sm"
          className="h-10 w-10 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};