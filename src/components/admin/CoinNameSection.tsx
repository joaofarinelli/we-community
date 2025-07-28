import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useCoinName } from '@/hooks/useCoinName';
import { toast } from '@/components/ui/use-toast';
import { Coins } from 'lucide-react';

export const CoinNameSection = () => {
  const { currentCompanyId } = useCompanyContext();
  const { data: currentCoinName, isLoading } = useCoinName();
  const [coinName, setCoinName] = useState('');
  const queryClient = useQueryClient();

  const updateCoinName = useMutation({
    mutationFn: async (newCoinName: string) => {
      if (!currentCompanyId) throw new Error('Company ID not found');

      const { error } = await supabase
        .from('companies')
        .update({ coin_name: newCoinName || 'WomanCoins' })
        .eq('id', currentCompanyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coinName'] });
      toast({
        title: "Nome das moedas atualizado!",
        description: "O nome das moedas foi alterado com sucesso.",
      });
      setCoinName('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o nome das moedas.",
      });
    },
  });

  const handleSave = () => {
    if (!coinName.trim()) return;
    updateCoinName.mutate(coinName.trim());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Nome das Moedas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Nome das Moedas
        </CardTitle>
        <CardDescription>
          Personalize o nome das moedas usado em toda a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coin-name">Nome Atual das Moedas</Label>
          <div className="text-sm text-muted-foreground">
            Atualmente: <span className="font-medium">{currentCoinName}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-coin-name">Novo Nome das Moedas</Label>
          <Input
            id="new-coin-name"
            placeholder="Ex: MoedaEmpresa, Tokens, Pontos..."
            value={coinName}
            onChange={(e) => setCoinName(e.target.value)}
            maxLength={50}
          />
          <div className="text-xs text-muted-foreground">
            Este nome será usado em ranking, marketplace, banco e outras seções
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!coinName.trim() || updateCoinName.isPending}
          className="w-full"
        >
          {updateCoinName.isPending ? 'Salvando...' : 'Atualizar Nome das Moedas'}
        </Button>
      </CardContent>
    </Card>
  );
};