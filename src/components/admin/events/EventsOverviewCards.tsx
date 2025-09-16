import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Coins, Target, Monitor, MapPin } from 'lucide-react';
import type { EventsAnalytics } from '@/hooks/useEventsAnalytics';

interface EventsOverviewCardsProps {
  data: EventsAnalytics;
  isLoading: boolean;
}

export const EventsOverviewCards = ({ data, isLoading }: EventsOverviewCardsProps) => {
  const cards = [
    {
      title: 'Total de Eventos',
      value: data?.totalEvents || 0,
      subtitle: `${data?.activeEvents || 0} ativos`,
      icon: Calendar,
      color: 'text-primary'
    },
    {
      title: 'Participantes',
      value: data?.totalParticipants || 0,
      subtitle: 'Total confirmados',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Receita Total',
      value: `${data?.totalRevenue || 0}`,
      subtitle: 'coins arrecadados',
      icon: Coins,
      color: 'text-yellow-600'
    },
    {
      title: 'Taxa de Ocupação',
      value: `${data?.averageOccupancy || 0}%`,
      subtitle: 'Ocupação média',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Eventos Online',
      value: data?.onlineEvents || 0,
      subtitle: `${data?.presentialEvents || 0} presenciais`,
      icon: Monitor,
      color: 'text-purple-600'
    },
    {
      title: 'Rascunhos',
      value: data?.draftEvents || 0,
      subtitle: `${data?.cancelledEvents || 0} cancelados`,
      icon: MapPin,
      color: 'text-orange-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};