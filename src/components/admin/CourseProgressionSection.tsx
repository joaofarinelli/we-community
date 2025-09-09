import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, BookOpen } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useUpdateCompany } from '@/hooks/useUpdateCompany';
import { toast } from 'sonner';

export const CourseProgressionSection = () => {
  const { data: company } = useCompany();
  const updateCompany = useUpdateCompany();
  const [isLoading, setIsLoading] = useState(false);
  
  const courseProgression = (company as any)?.course_progression || 'free';

  const handleProgressionChange = async (checked: boolean) => {
    if (!company?.id) return;
    
    setIsLoading(true);
    try {
      await updateCompany.mutateAsync({
        id: company.id,
        course_progression: checked ? 'linear' : 'free'
      });
      toast.success(
        checked 
          ? 'Progressão linear ativada - usuários precisam completar cursos em ordem'
          : 'Progressão livre ativada - usuários podem acessar qualquer curso'
      );
    } catch (error) {
      console.error('Error updating course progression:', error);
      toast.error('Erro ao atualizar configuração de progressão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Progressão de Cursos
        </CardTitle>
        <CardDescription>
          Configure como os usuários podem acessar os cursos na plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Progressão Linear</Label>
            <div className="text-sm text-muted-foreground">
              Quando ativada, usuários precisam completar um curso antes de acessar o próximo
            </div>
          </div>
          <Switch
            checked={courseProgression === 'linear'}
            onCheckedChange={handleProgressionChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Como funciona:</div>
          
          {courseProgression === 'linear' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Curso 1</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Curso 2</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span className="text-muted-foreground">Curso 3 (Bloqueado)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Curso 1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Curso 2</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span>Curso 3</span>
              </div>
              <span className="text-xs">(Todos acessíveis)</span>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            {courseProgression === 'linear' 
              ? 'Os cursos ficam bloqueados até que o anterior seja completado 100%'
              : 'Todos os cursos ficam disponíveis imediatamente, respeitando apenas os critérios de acesso'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};