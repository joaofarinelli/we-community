import { useState } from 'react';
import { Eye, MessageCircle, Copy, Calendar, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllTrails } from '@/hooks/useTrails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const UserTrailsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: trails, isLoading } = useAllTrails();

  const filteredTrails = trails?.filter(trail => {
    const matchesSearch = trail.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trail.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trail.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trail.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome da trilha ou usuária..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
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
      </div>

      {/* Trails Grid */}
      {filteredTrails && filteredTrails.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrails.map((trail) => (
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
                    <span className="font-medium">{trail.progress_percentage}%</span>
                  </div>
                  <Progress value={trail.progress_percentage} className="h-2" />
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {trail.life_area && (
                    <div>
                      <span className="font-medium">Área:</span> {trail.life_area}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Iniciada em:</span>{' '}
                    {format(new Date(trail.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
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
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma trilha encontrada com os filtros aplicados.' 
                : 'Nenhuma trilha criada ainda.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};