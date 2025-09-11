import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { FinancialChart } from './FinancialChart';
import { PaymentMethodDistribution } from './PaymentMethodDistribution';

export const FinancialDashboard = () => {
  const { data: metrics, isLoading } = useFinancialMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Receita Total',
      value: `R$ ${metrics?.totalRevenue?.toFixed(2) || '0,00'}`,
      description: 'Último mês',
      icon: DollarSign,
      trend: metrics?.revenueTrend || 0,
    },
    {
      title: 'Total de Transações',
      value: metrics?.totalTransactions || 0,
      description: 'Este mês',
      icon: CreditCard,
      trend: metrics?.transactionsTrend || 0,
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${metrics?.averageTicket?.toFixed(2) || '0,00'}`,
      description: 'Por transação',
      icon: TrendingUp,
      trend: metrics?.ticketTrend || 0,
    },
    {
      title: 'Taxa de Conversão',
      value: `${metrics?.conversionRate?.toFixed(1) || '0,0'}%`,
      description: 'Boletos pagos',
      icon: Users,
      trend: metrics?.conversionTrend || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={`${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend >= 0 ? '+' : ''}{card.trend}%
                </span>
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialChart />
        <PaymentMethodDistribution />
      </div>
    </div>
  );
};