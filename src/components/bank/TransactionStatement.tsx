import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Download, Search, Coins, Plus, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TransactionStatement = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('30');
  
  const { data: transactions, isLoading } = usePointsHistory(undefined, 100);

  const getActionIcon = (actionType: string, coins: number) => {
    if (actionType === 'transfer_sent') return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (actionType === 'transfer_received') return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    if (coins > 0) return <Plus className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-red-500" />;
  };

  const getActionLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      'create_post': 'Criou um post',
      'like_post': 'Curtiu um post',
      'comment_post': 'Comentou em um post',
      'receive_like': 'Recebeu uma curtida',
      'receive_comment': 'Recebeu um comentário',
      'transfer_sent': 'Transferência enviada',
      'transfer_received': 'Transferência recebida',
      'purchase_item': 'Compra no marketplace',
      'item_sold': 'Venda no marketplace',
      'challenge_reward': 'Recompensa de desafio'
    };
    
    return labels[actionType] || actionType;
  };

  const filteredTransactions = transactions?.filter(transaction => {
    if (filter === 'earned' && transaction.coins <= 0) return false;
    if (filter === 'spent' && transaction.coins >= 0) return false;
    if (filter === 'transfers' && !transaction.action_type.includes('transfer')) return false;
    
    if (searchTerm) {
      const label = getActionLabel(transaction.action_type).toLowerCase();
      if (!label.includes(searchTerm.toLowerCase())) return false;
    }

    // Period filter
    const daysAgo = parseInt(period);
    const transactionDate = new Date(transaction.created_at);
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysAgo);
    
    if (transactionDate < limitDate) return false;

    return true;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Extrato de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Extrato de Transações
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Label htmlFor="filter">Tipo</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="earned">Ganhos</SelectItem>
                <SelectItem value="spent">Gastos</SelectItem>
                <SelectItem value="transfers">Transferências</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="period">Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    {getActionIcon(transaction.action_type, transaction.coins)}
                  </div>
                  <div>
                    <p className="font-medium">{getActionLabel(transaction.action_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-bold ${
                    transaction.coins > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <Coins className="h-4 w-4" />
                    <span>
                      {transaction.coins > 0 ? '+' : ''}
                      {transaction.coins.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};