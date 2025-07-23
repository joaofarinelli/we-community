import { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronRight, User, Palette, Shield, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  tasks: string[];
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'profile',
    title: 'Completar seu perfil',
    description: 'Personalize seu perfil e edite informações básicas',
    completed: true,
    icon: User,
    tasks: ['Adicionar foto de perfil', 'Preencher informações básicas', 'Configurar bio']
  },
  {
    id: 'design',
    title: 'Crie o design da sua comunidade',
    description: 'Configure cores, logo e aparência da comunidade',
    completed: false,
    icon: Palette,
    tasks: ['Escolher cores da marca', 'Fazer upload do logo', 'Personalizar tema']
  },
  {
    id: 'access',
    title: 'Configurar acesso',
    description: 'Defina permissões e configurações de acesso',
    completed: false,
    icon: Shield,
    tasks: ['Configurar níveis de acesso', 'Definir regras de entrada', 'Configurar moderação']
  },
  {
    id: 'launch',
    title: 'Lance sua comunidade',
    description: 'Ative sua comunidade e convide os primeiros membros',
    completed: false,
    icon: Rocket,
    tasks: ['Revisar configurações', 'Convidar primeiros membros', 'Publicar comunidade']
  }
];

export function SetupChecklist() {
  const [openItems, setOpenItems] = useState<string[]>(['profile']);
  const completedCount = checklistItems.filter(item => item.completed).length;

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Primeiros Passos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {completedCount} de {checklistItems.length} tarefas concluídas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {checklistItems.map((item) => {
          const Icon = item.icon;
          const isOpen = openItems.includes(item.id);
          
          return (
            <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleItem(item.id)}>
              <Card className="border-l-4 border-l-primary/20">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2 ml-8">
                      {item.tasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{task}</span>
                        </div>
                      ))}
                      <Button size="sm" className="mt-3">
                        Começar
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}