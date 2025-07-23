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
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-heading text-gradient">Complete os primeiros passos</h2>
        <p className="text-muted-foreground text-lg">
          {completedCount} de {checklistItems.length} tarefas concluídas • Configure sua comunidade seguindo este guia passo a passo.
        </p>
      </div>
      
      <div className="space-y-4">
        {checklistItems.map((item, index) => {
          const Icon = item.icon;
          const isOpen = openItems.includes(item.id);
          
          return (
            <Collapsible 
              key={item.id} 
              open={isOpen} 
              onOpenChange={() => toggleItem(item.id)}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="bg-gradient-card shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl overflow-hidden border-0">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 hover:bg-background-secondary/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          item.completed 
                            ? 'bg-gradient-primary text-white shadow-elegant animate-float' 
                            : 'bg-muted/70 hover:bg-muted'
                        }`}>
                          {item.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <Icon className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <h3 className="font-bold text-lg font-heading mb-1">{item.title}</h3>
                          <p className="text-muted-foreground font-medium">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.completed && (
                          <div className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-semibold">
                            Concluído
                          </div>
                        )}
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-6">
                    <div className="space-y-3 ml-16">
                      {item.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center gap-4 p-4 bg-background-secondary/50 rounded-xl hover:bg-background-secondary/70 transition-colors group">
                          <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform"></div>
                          <span className="font-medium text-foreground/90">{task}</span>
                        </div>
                      ))}
                      <Button className="mt-4 shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5">
                        Começar
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}