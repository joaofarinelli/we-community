import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EventsFiltersProps {
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  onPeriodChange: (period: string) => void;
}

type PredefinedPeriod = 'last7days' | 'last30days' | 'last3months' | 'thisMonth' | 'thisYear' | 'custom';

export const EventsFilters = ({ onDateRangeChange, onPeriodChange }: EventsFiltersProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PredefinedPeriod>('last3months');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const predefinedPeriods = [
    { value: 'last7days', label: 'Últimos 7 dias' },
    { value: 'last30days', label: 'Últimos 30 dias' },
    { value: 'last3months', label: 'Últimos 3 meses' },
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'thisYear', label: 'Este ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const handlePeriodChange = (period: PredefinedPeriod) => {
    setSelectedPeriod(period);
    onPeriodChange(period);

    let startDate: Date | undefined;
    let endDate: Date | undefined = new Date();

    switch (period) {
      case 'last7days':
        startDate = subDays(endDate, 7);
        break;
      case 'last30days':
        startDate = subDays(endDate, 30);
        break;
      case 'last3months':
        startDate = subMonths(endDate, 3);
        break;
      case 'thisMonth':
        startDate = startOfMonth(endDate);
        endDate = endOfMonth(endDate);
        break;
      case 'thisYear':
        startDate = startOfYear(endDate);
        endDate = endOfYear(endDate);
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
    }

    onDateRangeChange(startDate, endDate);
  };

  const handleCustomDateChange = () => {
    if (selectedPeriod === 'custom') {
      onDateRangeChange(customStartDate, customEndDate);
    }
  };

  const clearCustomDates = () => {
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    if (selectedPeriod === 'custom') {
      onDateRangeChange(undefined, undefined);
    }
  };

  const getDateRangeText = () => {
    if (selectedPeriod !== 'custom') return null;
    
    if (customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (customStartDate) {
      return `A partir de ${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (customEndDate) {
      return `Até ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return 'Selecionar datas';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Período</label>
          <Select value={selectedPeriod} onValueChange={(value) => handlePeriodChange(value as PredefinedPeriod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {predefinedPeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Data início</label>
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !customStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        setIsStartDateOpen(false);
                        handleCustomDateChange();
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Data fim</label>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !customEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        setIsEndDateOpen(false);
                        handleCustomDateChange();
                      }}
                      locale={ptBR}
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(customStartDate || customEndDate) && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {getDateRangeText()}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCustomDates}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};