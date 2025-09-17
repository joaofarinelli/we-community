import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EventsOverviewCards } from '@/components/admin/events/EventsOverviewCards';
import { EventsChartsSection } from '@/components/admin/events/EventsChartsSection';
import { EventsTable } from '@/components/admin/events/EventsTable';
import { EventsFilters } from '@/components/admin/events/EventsFilters';
import { useEventsAnalytics } from '@/hooks/useEventsAnalytics';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { subMonths } from 'date-fns';

export const AdminEventsReportsPage = () => {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last3months');
  
  const { data: analytics, isLoading, refetch } = useEventsAnalytics(startDate, endDate);

  const handleDateRangeChange = (newStartDate?: Date, newEndDate?: Date) => {
    setStartDate(newStartDate || subMonths(new Date(), 3));
    setEndDate(newEndDate || new Date());
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relatórios de Eventos</h1>
              <p className="text-muted-foreground">
                Análise completa dos eventos da sua empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

          {/* Content Grid */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Overview Cards */}
              <EventsOverviewCards data={analytics!} isLoading={isLoading} />

              {/* Charts Section */}
              <EventsChartsSection data={analytics!} isLoading={isLoading} />

              {/* Detailed Table */}
              <EventsTable data={analytics!} isLoading={isLoading} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <EventsFilters 
                onDateRangeChange={handleDateRangeChange}
                onPeriodChange={handlePeriodChange}
              />
            </div>
        </div>
      </div>
    </AdminLayout>
  );
};