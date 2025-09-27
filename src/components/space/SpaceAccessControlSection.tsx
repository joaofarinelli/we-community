import { useState } from 'react';
import { Plus, Trash2, Edit, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useSpaceAccessRules, 
  useDeleteSpaceAccessRule,
  type SpaceAccessRule 
} from '@/hooks/useSpaceAccessRules';
import { SpaceAccessRuleDialog } from './SpaceAccessRuleDialog';

interface SpaceAccessControlSectionProps {
  spaceId: string;
}

const ruleTypeLabels = {
  view_space: 'Visualizar espaço',
  create_posts: 'Criar postagens',
  edit_posts: 'Editar postagens',
  delete_posts: 'Deletar postagens',
};

const ruleTypeDescriptions = {
  view_space: 'Quem pode ver e acessar este espaço',
  create_posts: 'Quem pode criar novas postagens neste espaço',
  edit_posts: 'Quem pode editar postagens existentes',
  delete_posts: 'Quem pode deletar postagens',
};

export const SpaceAccessControlSection = ({ spaceId }: SpaceAccessControlSectionProps) => {
  const [selectedRule, setSelectedRule] = useState<SpaceAccessRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState<SpaceAccessRule['rule_type']>('create_posts');

  const { data: accessRules = [], isLoading } = useSpaceAccessRules(spaceId);
  const deleteRuleMutation = useDeleteSpaceAccessRule();

  const handleCreateRule = (type: SpaceAccessRule['rule_type']) => {
    setRuleType(type);
    setSelectedRule(null);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: SpaceAccessRule) => {
    setSelectedRule(rule);
    setDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Tem certeza que deseja remover esta regra de acesso?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const getRuleByType = (type: SpaceAccessRule['rule_type']) => {
    return accessRules.find(rule => rule.rule_type === type);
  };

  const formatCriteriaDisplay = (rule: SpaceAccessRule) => {
    const criteria = [];
    if (rule.tag_ids?.length > 0) criteria.push(`${rule.tag_ids.length} tag(s)`);
    if (rule.level_ids?.length > 0) criteria.push(`${rule.level_ids.length} nível(s)`);
    if (rule.badge_ids?.length > 0) criteria.push(`${rule.badge_ids.length} selo(s)`);
    if (rule.user_roles?.length > 0) criteria.push(`${rule.user_roles.length} cargo(s)`);
    if (rule.user_ids?.length > 0) criteria.push(`${rule.user_ids.length} usuário(s) específico(s)`);
    
    return criteria.length > 0 
      ? criteria.join(', ') + ` (${rule.criteria_logic === 'any' ? 'qualquer' : 'todos'})`
      : 'Sem critérios específicos';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Controle de Acesso</h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <h3 className="text-sm font-medium text-foreground">Controle de Acesso</h3>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Configure quais usuários podem realizar cada ação baseado em tags, níveis, selos, cargos e usuários específicos.
      </p>

      <ScrollArea className="max-h-80 md:max-h-96">
        <div className="space-y-3">
          {Object.entries(ruleTypeLabels).map(([type, label]) => {
            const rule = getRuleByType(type as SpaceAccessRule['rule_type']);
            
            return (
              <Card key={type} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {ruleTypeDescriptions[type as keyof typeof ruleTypeDescriptions]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateRule(type as SpaceAccessRule['rule_type'])}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Configurar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {rule && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Critérios:</span>
                        <Badge variant="secondary" className="text-xs">
                          {formatCriteriaDisplay(rule)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <SpaceAccessRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        spaceId={spaceId}
        rule={selectedRule}
        defaultRuleType={ruleType}
      />
    </div>
  );
};