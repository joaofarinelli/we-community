import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import type { TrailAccessCriteria } from '@/hooks/useTrailAccess';

interface TrailAccessSettingsProps {
  accessCriteria: TrailAccessCriteria;
  onAccessCriteriaChange: (criteria: TrailAccessCriteria) => void;
}

export const TrailAccessSettings = ({ 
  accessCriteria, 
  onAccessCriteriaChange 
}: TrailAccessSettingsProps) => {
  const { data: levels } = useCompanyLevels();
  const [newTag, setNewTag] = useState('');
  const [newRole, setNewRole] = useState('');

  const toggleAvailableForAll = (checked: boolean) => {
    onAccessCriteriaChange({
      ...accessCriteria,
      is_available_for_all: checked
    });
  };

  const handleLevelChange = (levelId: string) => {
    onAccessCriteriaChange({
      ...accessCriteria,
      required_level_id: levelId === 'none' ? undefined : levelId
    });
  };

  const addTag = () => {
    if (newTag.trim() && !accessCriteria.required_tags?.includes(newTag.trim())) {
      onAccessCriteriaChange({
        ...accessCriteria,
        required_tags: [...(accessCriteria.required_tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    onAccessCriteriaChange({
      ...accessCriteria,
      required_tags: accessCriteria.required_tags?.filter(t => t !== tag) || []
    });
  };

  const addRole = () => {
    if (newRole && !accessCriteria.required_roles?.includes(newRole)) {
      onAccessCriteriaChange({
        ...accessCriteria,
        required_roles: [...(accessCriteria.required_roles || []), newRole]
      });
      setNewRole('');
    }
  };

  const removeRole = (role: string) => {
    onAccessCriteriaChange({
      ...accessCriteria,
      required_roles: accessCriteria.required_roles?.filter(r => r !== role) || []
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critérios de Acesso</CardTitle>
        <CardDescription>
          Configure quem pode acessar esta trilha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disponível para todos */}
        <div className="flex items-center space-x-2">
          <Switch
            id="available-for-all"
            checked={accessCriteria.is_available_for_all || false}
            onCheckedChange={toggleAvailableForAll}
          />
          <Label htmlFor="available-for-all">
            Disponível para todas as usuárias
          </Label>
        </div>

        {!accessCriteria.is_available_for_all && (
          <div className="space-y-4">
            {/* Nível obrigatório */}
            <div className="space-y-2">
              <Label>Nível Obrigatório</Label>
              <Select 
                value={accessCriteria.required_level_id || 'none'}
                onValueChange={handleLevelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum nível específico</SelectItem>
                  {levels?.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags obrigatórias */}
            <div className="space-y-2">
              <Label>Tags Obrigatórias</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {accessCriteria.required_tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Funções obrigatórias */}
            <div className="space-y-2">
              <Label>Funções Obrigatórias</Label>
              <div className="flex gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addRole} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {accessCriteria.required_roles?.map((role) => (
                  <Badge key={role} variant="secondary" className="flex items-center gap-1">
                    {role === 'member' ? 'Membro' : 
                     role === 'admin' ? 'Admin' : 
                     role === 'owner' ? 'Proprietário' : role}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeRole(role)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};