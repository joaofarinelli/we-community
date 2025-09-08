import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Filter, X } from 'lucide-react';
import { useAllFilteredUsers, type FilteredUser } from '@/hooks/useCompanyUsersWithFilters';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';

interface BulkActionAudienceTabProps {
  audienceConfig: any;
  onAudienceConfigChange: (config: any) => void;
}

export function BulkActionAudienceTab({
  audienceConfig,
  onAudienceConfigChange,
}: BulkActionAudienceTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    audienceConfig.selected_users || []
  );
  const [filters, setFilters] = useState(audienceConfig.filters || {});
  const [selectionMode, setSelectionMode] = useState<'filters' | 'manual'>(
    audienceConfig.selected_users ? 'manual' : 'filters'
  );

  const { data: filteredUsers = [] } = useAllFilteredUsers(filters);
  const { data: allUsers = [] } = useAllFilteredUsers({});
  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();

  // Filter users for manual selection based on search
  const usersToDisplay = allUsers.filter(user => 
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const config = selectionMode === 'manual' 
      ? { selected_users: selectedUsers }
      : { filters };
    
    onAudienceConfigChange(config);
  }, [selectedUsers, filters, selectionMode, onAudienceConfigChange]);

  const handleUserToggle = (userId: string) => {
    const newSelected = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectionMode === 'manual') {
      setSelectedUsers(usersToDisplay.map(user => user.user_id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const updateFilters = (updates: any) => {
    setFilters({ ...filters, ...updates });
  };

  const renderFiltersTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar por nome/email</Label>
          <Input
            id="search"
            placeholder="Digite para filtrar..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="roles">Funções</Label>
          <Select
            value={filters.roles || ''}
            onValueChange={(value) => updateFilters({ roles: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as funções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as funções</SelectItem>
              <SelectItem value="owner">Proprietário</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="member">Membro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Select
            value={filters.tags || ''}
            onValueChange={(value) => updateFilters({ tags: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as tags</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag.id} value={tag.name}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="levels">Níveis</Label>
          <Select
            value={filters.levels || ''}
            onValueChange={(value) => updateFilters({ levels: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os níveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os níveis</SelectItem>
              {levels.map(level => (
                <SelectItem key={level.id} value={level.level_name}>
                  {level.level_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="badges">Selos</Label>
          <Select
            value={filters.badges || ''}
            onValueChange={(value) => updateFilters({ badges: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os selos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os selos</SelectItem>
              {badges.map(badge => (
                <SelectItem key={badge.id} value={badge.name}>
                  {badge.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">
            Usuários que atendem aos filtros: {filteredUsers.length}
          </span>
          <Badge variant="outline">
            <Filter className="h-3 w-3 mr-1" />
            {Object.keys(filters).filter(key => filters[key]).length} filtros ativos
          </Badge>
        </div>
        
        <ScrollArea className="h-40">
          {filteredUsers.slice(0, 20).map(user => (
            <div key={user.user_id} className="flex items-center justify-between py-1">
              <span className="text-sm">
                {user.first_name} {user.last_name}
              </span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          ))}
          {filteredUsers.length > 20 && (
            <p className="text-xs text-muted-foreground py-2">
              ... e mais {filteredUsers.length - 20} usuários
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  const renderManualTab = () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="manual-search">Buscar usuários</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="manual-search"
              placeholder="Digite nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={handleSelectAll} variant="outline" size="sm">
          Selecionar Todos
        </Button>
        <Button onClick={handleDeselectAll} variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4" />
        <span className="text-sm">
          {selectedUsers.length} de {usersToDisplay.length} usuários selecionados
        </span>
      </div>

      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-2">
          {usersToDisplay.map(user => (
            <div key={user.user_id} className="flex items-center space-x-3 p-2 rounded hover:bg-accent">
              <Checkbox
                checked={selectedUsers.includes(user.user_id)}
                onCheckedChange={() => handleUserToggle(user.user_id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definir Público-Alvo</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectionMode} onValueChange={(value) => setSelectionMode(value as 'filters' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">Por Filtros</TabsTrigger>
            <TabsTrigger value="manual">Seleção Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters">
            {renderFiltersTab()}
          </TabsContent>
          
          <TabsContent value="manual">
            {renderManualTab()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}