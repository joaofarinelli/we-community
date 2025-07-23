import { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function SetupCard() {
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [completedTasks, setCompletedTasks] = useState(['account']);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const progressPercentage = (completedTasks.length / 11) * 100;

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Checklist de configuração</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedTasks.length} de 11 tarefas concluídas</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Completar perfil - Expandido */}
        <Collapsible open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto border border-border/50 rounded-lg hover:bg-muted/50"
            >
              <span className="font-medium">Completar seu perfil</span>
              {isProfileOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 ml-4 space-y-3">
            {/* Tarefa concluída */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Check className="h-4 w-4 text-green-600" />
              <span className="line-through text-muted-foreground">Criar conta</span>
            </div>
            
            {/* Tarefa pendente */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <span>Personalizar seu perfil</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  Editar perfil
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => toggleTask('profile')}
                  className="text-xs"
                >
                  Marcar como concluído
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Outros itens colapsados */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto border border-border/50 rounded-lg hover:bg-muted/50"
            >
              <span className="font-medium">Crie o design da sua comunidade</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto border border-border/50 rounded-lg hover:bg-muted/50"
            >
              <span className="font-medium">Configurar acesso</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto border border-border/50 rounded-lg hover:bg-muted/50"
            >
              <span className="font-medium">Lance sua comunidade</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </CardContent>
    </Card>
  );
}