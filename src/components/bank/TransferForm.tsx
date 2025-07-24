import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, User, Coins, AlertCircle } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useTransferCoins } from '@/hooks/useTransferCoins';
import { useUserCoins } from '@/hooks/useUserPoints';
import { toast } from '@/components/ui/use-toast';

export const TransferForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { data: searchResults } = useUserSearch(searchTerm);
  const { data: userCoins } = useUserCoins();
  const transferMutation = useTransferCoins();

  const balance = userCoins?.total_coins || 0;
  const transferAmount = parseInt(amount) || 0;

  const handleTransfer = async () => {
    if (!selectedUser || transferAmount <= 0) return;

    if (transferAmount > balance) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: "Você não tem moedas suficientes para esta transferência.",
      });
      return;
    }

    try {
      await transferMutation.mutateAsync({
        toUserId: selectedUser.user_id,
        amount: transferAmount,
        message,
      });
      
      // Reset form
      setSelectedUser(null);
      setAmount('');
      setMessage('');
      setSearchTerm('');
      setShowConfirmation(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transferir Moedas
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Buscar Usuário */}
        <div>
          <Label htmlFor="user-search">Destinatário</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Buscar usuário por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Resultados da busca */}
          {searchTerm.length >= 2 && searchResults && searchResults.length > 0 && !selectedUser && (
            <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchTerm('');
                  }}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Usuário selecionado */}
          {selectedUser && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Alterar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Valor */}
        <div>
          <Label htmlFor="amount">Valor</Label>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="Digite o valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              min="1"
              max={balance}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">
              Saldo disponível: {balance.toLocaleString()} moedas
            </p>
            {transferAmount > balance && (
              <Badge variant="destructive" className="text-xs">
                Saldo insuficiente
              </Badge>
            )}
          </div>
        </div>

        {/* Mensagem */}
        <div>
          <Label htmlFor="message">Mensagem (opcional)</Label>
          <Textarea
            id="message"
            placeholder="Adicione uma mensagem à transferência..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Botão de transferir */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={!selectedUser || transferAmount <= 0 || transferAmount > balance}
              onClick={() => setShowConfirmation(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Transferir {transferAmount > 0 ? transferAmount.toLocaleString() : ''} Moedas
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Transferência</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinatário:</span>
                  <span className="font-medium">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{transferAmount.toLocaleString()} moedas</span>
                </div>
                {message && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensagem:</span>
                    <span className="font-medium max-w-40 text-right">{message}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Saldo após transferência:</span>
                  <span className="font-bold">
                    {(balance - transferAmount).toLocaleString()} moedas
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleTransfer}
                  disabled={transferMutation.isPending}
                >
                  {transferMutation.isPending ? 'Processando...' : 'Confirmar Transferência'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};