import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { EventsAnalytics } from '@/hooks/useEventsAnalytics';

interface EventsTableProps {
  data: EventsAnalytics;
  isLoading: boolean;
}

export const EventsTable = ({ data, isLoading }: EventsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<'start_date' | 'participants_count' | 'revenue'>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedEvents = data?.recentEvents?.slice().sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'start_date':
        aValue = new Date(a.start_date).getTime();
        bValue = new Date(b.start_date).getTime();
        break;
      case 'participants_count':
        aValue = a.participants_count;
        bValue = b.participants_count;
        break;
      case 'revenue':
        aValue = a.revenue;
        bValue = b.revenue;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'rascunho': return 'secondary';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'rascunho': return 'Rascunho';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getLocationTypeLabel = (locationType: string) => {
    switch (locationType) {
      case 'online': return 'Online';
      case 'presencial': return 'Presencial';
      case 'indefinido': return 'Indefinido';
      default: return locationType;
    }
  };

  const exportToCSV = () => {
    if (!data?.recentEvents?.length) return;

    const headers = ['Título', 'Data Início', 'Data Fim', 'Status', 'Participantes', 'Receita', 'Espaço', 'Tipo'];
    const csvContent = [
      headers.join(','),
      ...data.recentEvents.map(event => [
        `"${event.title}"`,
        format(new Date(event.start_date), 'dd/MM/yyyy HH:mm'),
        format(new Date(event.end_date), 'dd/MM/yyyy HH:mm'),
        getStatusLabel(event.status),
        event.participants_count,
        event.revenue,
        `"${event.space_name}"`,
        getLocationTypeLabel(event.location_type)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `eventos_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={7} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Eventos Recentes</CardTitle>
        <Button 
          onClick={exportToCSV} 
          variant="outline" 
          size="sm"
          disabled={!data?.recentEvents?.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('start_date')}
                >
                  Data Início {sortField === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('participants_count')}
                >
                  Participantes {sortField === 'participants_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('revenue')}
                >
                  Receita {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Espaço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents?.length ? (
                sortedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-48 truncate" title={event.title}>
                        {event.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(event.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{event.participants_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{event.revenue}</span>
                      <span className="text-xs text-muted-foreground ml-1">coins</span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-sm" title={event.space_name}>
                        {event.space_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getLocationTypeLabel(event.location_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/events/${event.id}`)}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum evento encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};