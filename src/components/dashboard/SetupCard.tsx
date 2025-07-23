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
  return;
}