import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useCreateConversation } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

interface ChatUserSearchProps {
  onSelectUser: (userId: string, conversationId: string) => void;
}

export const ChatUserSearch: React.FC<ChatUserSearchProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const { data: users = [], isLoading } = useUserSearch(searchTerm);
  const createConversation = useCreateConversation();

  const handleSelectUser = async (userId: string) => {
    try {
      console.log('🚀 Creating conversation with user:', userId);
      const conversationId = await createConversation.mutateAsync(userId);
      console.log('✅ Conversation created with ID:', conversationId);
      
      // Wait a bit for the query to invalidate and refetch
      setTimeout(() => {
        onSelectUser(userId, conversationId);
      }, 100);
      
      setSearchTerm('');
      toast({
        title: "Conversa iniciada",
        description: "Você pode começar a conversar agora.",
      });
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchTerm.length >= 2 && (
        <ScrollArea className="max-h-40">
          <div className="space-y-1">
            {isLoading ? (
              <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
            ) : users.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">Nenhum usuário encontrado</div>
            ) : (
              users.map((user) => (
                <Button
                  key={user.user_id}
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto"
                  onClick={() => handleSelectUser(user.user_id)}
                  disabled={createConversation.isPending}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {user.first_name?.[0] || '?'}
                        {user.last_name?.[0] || ''}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};