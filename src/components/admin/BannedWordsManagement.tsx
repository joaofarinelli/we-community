import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useBannedWords } from '@/hooks/useBannedWords';
import { useToast } from '@/hooks/use-toast';

export const BannedWordsManagement = () => {
  const { bannedWords, isLoading, addBannedWord, updateBannedWord, deleteBannedWord } = useBannedWords();
  const [newWord, setNewWord] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddWord = async () => {
    if (!newWord.trim()) {
      toast({
        title: 'Palavra necessária',
        description: 'Digite uma palavra para adicionar à lista de proibidas.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addBannedWord.mutateAsync({ word: newWord.trim(), severity: newSeverity });
      setNewWord('');
      setNewSeverity('medium');
    } catch (error) {
      console.error('Error adding banned word:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateBannedWord.mutateAsync({ id, updates: { is_active: !isActive } });
    } catch (error) {
      console.error('Error updating banned word:', error);
    }
  };

  const handleDeleteWord = async () => {
    if (!deleteId) return;
    
    try {
      await deleteBannedWord.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting banned word:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Média';
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando palavras proibidas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Palavras Proibidas</h2>
        <p className="text-muted-foreground">
          Gerencie a lista de palavras que serão automaticamente detectadas e moderadas em posts e comentários.
        </p>
      </div>

      {/* Add new word form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Nova Palavra</span>
          </CardTitle>
          <CardDescription>
            Adicione palavras que devem ser automaticamente moderadas. O sistema detecta variações inteligentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Input
              placeholder="Digite a palavra proibida"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
            />
            <Select value={newSeverity} onValueChange={(value) => setNewSeverity(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddWord} disabled={addBannedWord.isPending}>
              {addBannedWord.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banned words list */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Palavras Proibidas ({bannedWords.length})</CardTitle>
          <CardDescription>
            Palavras que são automaticamente detectadas e moderadas pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bannedWords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma palavra proibida configurada.
            </div>
          ) : (
            <div className="space-y-3">
              {bannedWords.map((word) => (
                <div key={word.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{word.word}</div>
                    <Badge variant={getSeverityColor(word.severity)}>
                      {getSeverityLabel(word.severity)}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {word.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {word.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={word.is_active}
                      onCheckedChange={() => handleToggleActive(word.id, word.is_active)}
                      disabled={updateBannedWord.isPending}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(word.id)}
                      disabled={deleteBannedWord.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta palavra da lista de palavras proibidas? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWord} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};