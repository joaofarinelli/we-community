import { useState, useMemo, useCallback } from 'react';
import { Eye, MessageCircle, Copy, Calendar, User, TrendingUp, Edit, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useFilteredTrails, TrailFilters } from '@/hooks/useFilteredTrails';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { EditTrailDialog } from './EditTrailDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const UserTrailsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedTrail, setSelectedTrail] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Data hooks
  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();

  // Prepare filters
  const filters: TrailFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    levelIds: selectedLevels.length > 0 ? selectedLevels : undefined,
    badgeIds: selectedBadges.length > 0 ? selectedBadges : undefined,
  }), [searchTerm, statusFilter, selectedTags, selectedLevels, selectedBadges]);

  const { data: trails = [], isLoading } = useFilteredTrails(filters);

  const handleEditTrail = useCallback((trail: any) => {
    setSelectedTrail(trail);
    setShowEditDialog(true);
  }, []);

  const handleTagChange = useCallback((tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTags(prev => [...prev, tagId]);
    } else {
      setSelectedTags(prev => prev.filter(id => id !== tagId));
    }
  }, []);

  const handleLevelChange = useCallback((levelId: string, checked: boolean) => {
    if (checked) {
      setSelectedLevels(prev => [...prev, levelId]);
    } else {
      setSelectedLevels(prev => prev.filter(id => id !== levelId));
    }
  }, []);

  const handleBadgeChange = useCallback((badgeId: string, checked: boolean) => {
    if (checked) {
      setSelectedBadges(prev => [...prev, badgeId]);
    } else {
      setSelectedBadges(prev => prev.filter(id => id !== badgeId));
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedTags([]);
    setSelectedLevels([]);
    setSelectedBadges([]);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || selectedTags.length > 0 || selectedLevels.length > 0 || selectedBadges.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-4 w-4" />;
      case 'completed':
        return <Calendar className="h-4 w-4" />;
      case 'paused':
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded flex-1 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por nome da trilha ou usuária..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="flex-1 min-w-[300px]"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {(selectedTags.length + selectedLevels.length + selectedBadges.length) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedTags.length + selectedLevels.length + selectedBadges.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-96 overflow-y-auto bg-background border z-50" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filtros Avançados</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-auto p-1 text-xs"
                  >
                    Limpar tudo
                  </Button>
                )}
              </div>

              <Separator />

              {/* Tags Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="max-h-24 overflow-y-auto space-y-2 pr-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                      />
                      <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Levels Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Níveis</Label>
                <div className="max-h-24 overflow-y-auto space-y-2 pr-2">
                  {levels.map((level) => (
                    <div key={level.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level.id}`}
                        checked={selectedLevels.includes(level.id)}
                        onCheckedChange={(checked) => handleLevelChange(level.id, !!checked)}
                      />
                      <Label htmlFor={`level-${level.id}`} className="text-sm flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: (level as any).level_color }}
                        />
                        {level.level_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Badges Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selos</Label>
                <div className="max-h-24 overflow-y-auto space-y-2 pr-2">
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`badge-${badge.id}`}
                        checked={selectedBadges.includes(badge.id)}
                        onCheckedChange={(checked) => handleBadgeChange(badge.id, !!checked)}
                      />
                      <Label htmlFor={`badge-${badge.id}`} className="text-sm">
                        {badge.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? (
              <Badge key={tagId} variant="secondary" className="gap-1">
                {tag.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleTagChange(tagId, false)}
                />
              </Badge>
            ) : null;
          })}
          {selectedLevels.map(levelId => {
            const level = levels.find(l => l.id === levelId);
            return level ? (
              <Badge key={levelId} variant="secondary" className="gap-1">
                {level.level_name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleLevelChange(levelId, false)}
                />
              </Badge>
            ) : null;
          })}
          {selectedBadges.map(badgeId => {
            const badge = badges.find(b => b.id === badgeId);
            return badge ? (
              <Badge key={badgeId} variant="secondary" className="gap-1">
                {badge.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleBadgeChange(badgeId, false)}
                />
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Trails Grid */}
      {trails && trails.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trails.map((trail) => (
            <Card key={trail.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{trail.name}</CardTitle>
                  <Badge variant={getStatusVariant(trail.status)}>
                    {getStatusIcon(trail.status)}
                    <span className="ml-1">{getStatusLabel(trail.status)}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {trail.profiles?.first_name || 'Usuário'} {trail.profiles?.last_name || ''}
                  </span>
                </div>
                {trail.description && (
                  <CardDescription className="line-clamp-2">
                    {trail.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">{(trail as any).progress_percentage}%</span>
                  </div>
                  <Progress value={(trail as any).progress_percentage} className="h-2" />
                </div>

                {/* User Info */}
                <div className="space-y-2 text-sm">
                  {/* User Level */}
                  {trail.user_level && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Nível:</span>
                      <Badge variant="outline" className="gap-1">
                        <div 
                          className="w-2 h-2 rounded" 
                          style={{ backgroundColor: trail.user_level.level_color }}
                        />
                        {trail.user_level.level_name}
                      </Badge>
                    </div>
                  )}

                  {/* User Tags */}
                  {trail.user_tags && trail.user_tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {trail.user_tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.tag_name}
                          </Badge>
                        ))}
                        {trail.user_tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{trail.user_tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User Badges */}
                  {trail.user_badges && trail.user_badges.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground text-sm">Selos:</span>
                      <div className="flex flex-wrap gap-1">
                        {trail.user_badges.slice(0, 2).map((badge, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {badge.badge_name}
                          </Badge>
                        ))}
                        {trail.user_badges.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{trail.user_badges.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {(trail as any).life_area && (
                    <div>
                      <span className="font-medium">Área:</span> {(trail as any).life_area}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Iniciada em:</span>{' '}
                    {(trail as any).started_at && !isNaN(new Date((trail as any).started_at).getTime()) 
                      ? format(new Date((trail as any).started_at), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Data não disponível'
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditTrail(trail)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'Nenhuma trilha encontrada com os filtros aplicados.' 
                : 'Nenhuma trilha criada ainda.'}
            </p>
          </CardContent>
        </Card>
      )}

      <EditTrailDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        trail={selectedTrail}
      />
    </div>
  );
};