import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export const BugReportsEmailSection = () => {
  const { data: company, refetch } = useCompany();
  const { toast } = useToast();
  const [email, setEmail] = useState(company?.bug_reports_email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!company?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ bug_reports_email: email || null })
        .eq('id', company.id);

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Email salvo com sucesso!",
        description: email 
          ? "Os bug reports serão enviados para o email configurado." 
          : "Email removido. Bug reports não serão mais enviados por email.",
      });
    } catch (error) {
      console.error('Error updating bug reports email:', error);
      toast({
        title: "Erro ao salvar email",
        description: "Não foi possível salvar o email de bug reports. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Email para Bug Reports</CardTitle>
        </div>
        <CardDescription>
          Configure o email que receberá notificações quando novos bug reports forem enviados pelos usuários.
          Se não configurado, os reports ficarão apenas no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bug-reports-email">Email de Recebimento</Label>
          <Input
            id="bug-reports-email"
            type="email"
            placeholder="bugs@suaempresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar Email"}
          </Button>
          
          {email && (
            <Button 
              variant="outline" 
              onClick={() => setEmail('')}
              disabled={isLoading}
            >
              Remover Email
            </Button>
          )}
        </div>

        {company?.bug_reports_email && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Email atual:</strong> {company.bug_reports_email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Novos bug reports serão enviados automaticamente para este email.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};