import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useManageLevels } from '@/hooks/useManageLevels';
import { LevelForm } from './LevelForm';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const LevelManagement = () => {
  const { data: levels, isLoading, error } = useCompanyLevels();
  const { deleteLevel } = useManageLevels();
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  console.log('LevelManagement: Render state', { levels, isLoading, error });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('LevelManagement: Error loading levels', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>Erro ao carregar os níveis.</p>
            <p className="text-sm">Verifique suas permissões e tente novamente.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async (levelId: string) => {
    await deleteLevel.mutateAsync(levelId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Níveis</CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Nível
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Nível</DialogTitle>
              </DialogHeader>
              <LevelForm onSuccess={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {levels && levels.length > 0 ? (
              levels.map((level) => {
                if (!level) {
                  console.warn('LevelManagement: Invalid level data', level);
                  return null;
                }
                
                const IconComponent = level.level_icon ? (Icons as any)[level.level_icon] as React.ComponentType<LucideProps> : null;
                
                return (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{level.level_number}
                        </span>
                         <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: level.level_color ? `${level.level_color}15` : undefined,
                            borderColor: level.level_color || undefined,
                            color: level.level_color || undefined
                          }}
                        >
                          {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
                          {level.level_name || 'Nome não definido'}
                        </Badge>
                      </div>
                       <div className="text-sm text-muted-foreground">
                        {level.min_coins_required || 0} - {level.max_coins_required || '∞'} WomanCoins
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar Nível</DialogTitle>
                          </DialogHeader>
                          <LevelForm 
                            level={level}
                            onSuccess={() => setEditingLevel(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Nível</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o nível "{level.level_name}"? 
                              Esta ação não pode ser desfeita e pode afetar usuários que estão neste nível.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(level.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum nível criado ainda.</p>
                <p className="text-sm">Crie o primeiro nível para começar!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};