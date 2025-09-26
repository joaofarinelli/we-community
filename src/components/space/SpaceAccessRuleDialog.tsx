import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  useCreateSpaceAccessRule, 
  useUpdateSpaceAccessRule,
  type SpaceAccessRule,
  type SpaceAccessRuleInput 
} from '@/hooks/useSpaceAccessRules';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { useUserSearch } from '@/hooks/useUserSearch';

interface SpaceAccessRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  rule?: SpaceAccessRule | null;
  defaultRuleType?: SpaceAccessRule['rule_type'];
}

const ruleTypeLabels = {
  view_space: 'Visualizar espaço',
  create_posts: 'Criar postagens',
  edit_posts: 'Editar postagens',
  delete_posts: 'Deletar postagens',
};

const roleOptions = [
  { value: 'owner', label: 'Proprietário' },
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Membro' },
];

export const SpaceAccessRuleDialog = ({
  open,
  onOpenChange,
  spaceId,
  rule,
  defaultRuleType = 'create_posts',
}: SpaceAccessRuleDialogProps) => {
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<SpaceAccessRule['rule_type']>(defaultRuleType);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [criteriaLogic, setCriteriaLogic] = useState<'any' | 'all'>('any');

  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();
  const { data: searchResults = [] } = useUserSearch(userSearchTerm);

  const createRuleMutation = useCreateSpaceAccessRule();
  const updateRuleMutation = useUpdateSpaceAccessRule();

  const isEditing = !!rule;

  useEffect(() => {
    if (rule) {
      setRuleName(rule.rule_name);
      setRuleType(rule.rule_type);
      setSelectedTags(rule.tag_ids || []);
      setSelectedLevels(rule.level_ids || []);
      setSelectedBadges(rule.badge_ids || []);
      setSelectedRoles(rule.user_roles || []);
      setSelectedUsers(rule.user_ids || []);
      setCriteriaLogic(rule.criteria_logic);
    } else {
      setRuleName(ruleTypeLabels[defaultRuleType] || '');
      setRuleType(defaultRuleType);
      setSelectedTags([]);
      setSelectedLevels([]);
      setSelectedBadges([]);
      setSelectedRoles([]);
      setSelectedUsers([]);
      setUserSearchTerm('');
      setCriteriaLogic('any');
    }
  }, [rule, defaultRuleType, open]);

  const handleSave = () => {
    const ruleData: SpaceAccessRuleInput = {
      rule_name: ruleName,
      rule_type: ruleType,
      tag_ids: selectedTags,
      level_ids: selectedLevels,
      badge_ids: selectedBadges,
      user_roles: selectedRoles,
      user_ids: selectedUsers,
      criteria_logic: criteriaLogic,
    };

    if (isEditing && rule) {
      updateRuleMutation.mutate({
        ruleId: rule.id,
        ruleData,
      }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createRuleMutation.mutate({
        spaceId,
        ruleData,
      }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const hasAnyCriteria = selectedTags.length > 0 || selectedLevels.length > 0 || 
    selectedBadges.length > 0 || selectedRoles.length > 0 || selectedUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar regra de acesso' : 'Nova regra de acesso'}
          </DialogTitle>
          <DialogDescription>
            Configure quais usuários podem realizar esta ação baseado em critérios específicos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 p-1">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Nome da regra</Label>
              <Input
                id="rule-name"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Digite um nome para a regra"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de ação</Label>
              <RadioGroup value={ruleType} onValueChange={(value) => setRuleType(value as SpaceAccessRule['rule_type'])}>
                {Object.entries(ruleTypeLabels).map(([type, label]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={type} />
                    <Label htmlFor={type} className="font-normal">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Lógica dos critérios</Label>
                <Badge variant="outline">
                  {hasAnyCriteria ? `${selectedTags.length + selectedLevels.length + selectedBadges.length + selectedRoles.length + selectedUsers.length} critérios` : 'Nenhum critério'} 
                </Badge>
              </div>
              
              <RadioGroup value={criteriaLogic} onValueChange={(value) => setCriteriaLogic(value as 'any' | 'all')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="any" id="any" />
                  <Label htmlFor="any" className="font-normal">
                    Qualquer critério (OR) - usuário precisa atender pelo menos um critério
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">
                    Todos os critérios (AND) - usuário precisa atender todos os critérios
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-32">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => toggleSelection(tag.id, selectedTags, setSelectedTags)}
                        />
                        <Label className="text-sm font-normal cursor-pointer">
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Níveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-32">
                    {levels.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          checked={selectedLevels.includes(level.id)}
                          onCheckedChange={() => toggleSelection(level.id, selectedLevels, setSelectedLevels)}
                        />
                        <Label className="text-sm font-normal cursor-pointer">
                          {level.level_name}
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-32">
                    {badges.map((badge) => (
                      <div key={badge.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          checked={selectedBadges.includes(badge.id)}
                          onCheckedChange={() => toggleSelection(badge.id, selectedBadges, setSelectedBadges)}
                        />
                        <Label className="text-sm font-normal cursor-pointer">
                          {badge.name}
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cargos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roleOptions.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={() => toggleSelection(role.value, selectedRoles, setSelectedRoles)}
                      />
                      <Label className="text-sm font-normal cursor-pointer">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Specific Users Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Usuários Específicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Buscar usuários..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div key={user.user_id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={() => toggleSelection(user.user_id, selectedUsers, setSelectedUsers)}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <Label className="text-sm font-normal cursor-pointer flex-1">
                            {user.first_name} {user.last_name}
                          </Label>
                        </div>
                      ))}
                      
                      {userSearchTerm && searchResults.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Nenhum usuário encontrado
                        </div>
                      )}
                      
                      {!userSearchTerm && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Digite para buscar usuários
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!ruleName.trim() || createRuleMutation.isPending || updateRuleMutation.isPending}
          >
            {isEditing ? 'Atualizar' : 'Criar'} regra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};