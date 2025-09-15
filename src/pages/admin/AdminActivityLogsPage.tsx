import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminActivityLogs } from '@/hooks/useAdminActivityLogs';
import { getActionTypeLabel, getActionTypeIcon } from '@/hooks/usePointsHistory';
import { 
  Activity, 
  Users, 
  Coins, 
  TrendingUp, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  Download,
  Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const AdminActivityLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>();

  const { 
    data,
    isLoading
  } = useAdminActivityLogs({
    search: searchTerm,
    actionType: selectedActionType === 'all' ? undefined : selectedActionType,
    days: selectedPeriod === 'custom' ? undefined : parseInt(selectedPeriod),
    customDate: selectedPeriod === 'custom' ? customDate : undefined,
    limit: 50
  });

  const activities = data?.activities || [];
  const totalCount = data?.totalCount || 0;
  const stats = data?.stats;
  const actionTypes = data?.actionTypes || [];

  const periodOptions = [
    { value: '1', label: 'Últimas 24 horas' },
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Registros de Atividades</h1>
              <p className="text-muted-foreground">
                Monitore todas as atividades e pontuações da sua comunidade
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registros de Atividades</h1>
            <p className="text-muted-foreground">
              Monitore todas as atividades e pontuações da sua comunidade
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Dados
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Atividades</p>
                <p className="text-2xl font-bold">{stats?.totalActivities || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Coins className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coins Distribuídos</p>
                <p className="text-2xl font-bold">{stats?.totalCoinsDistributed || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atividade Mais Comum</p>
                <p className="text-sm font-semibold">
                  {stats?.mostCommonActivity ? getActionTypeLabel(stats.mostCommonActivity) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Type Filter */}
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Tipo de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as atividades</SelectItem>
                  {actionTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getActionTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Period Filter */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Date Picker */}
              {selectedPeriod === 'custom' && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, 'PPP', { locale: ptBR }) : 'Escolher data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Atividades Recentes</CardTitle>
            <Badge variant="secondary">
              {totalCount || 0} registros encontrados
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros para ver mais resultados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Usuário</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Atividade</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Pontos/Coins</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Data</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities?.map((activity, index) => (
                        <tr key={`${activity.id}-${index}`} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={activity.profiles?.avatar_url} 
                                  alt={activity.profiles?.first_name} 
                                />
                                <AvatarFallback className="text-xs">
                                  {activity.profiles?.first_name?.charAt(0)}{activity.profiles?.last_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {activity.profiles?.first_name} {activity.profiles?.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.profiles?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getActionTypeIcon(activity.action_type)}</span>
                              <div>
                                <p className="font-medium text-sm">
                                  {getActionTypeLabel(activity.action_type)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {activity.action_type}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span className={cn(
                                "font-medium text-sm",
                                activity.points > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {activity.points > 0 ? '+' : ''}{activity.points}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            <div>
                              <p>{format(new Date(activity.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                              <p className="text-xs">
                                {formatDistanceToNow(new Date(activity.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};