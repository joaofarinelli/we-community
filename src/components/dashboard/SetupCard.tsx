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
    setCompletedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };
  const progressPercentage = completedTasks.length / 11 * 100;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Primeiros Passos</h3>
          <span className="text-sm text-muted-foreground">{completedTasks.length}/11 concluídos</span>
        </div>
        <Progress value={progressPercentage} className="mt-2" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Complete estas etapas para configurar sua comunidade
        </p>
      </CardContent>
    </Card>
  );
}