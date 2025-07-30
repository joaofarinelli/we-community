import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flame, Trophy, Target, Award, Clock } from 'lucide-react';
import { useUserStreak, useCompanyStreakLeaderboard } from '@/hooks/useUserStreak';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { StreakBadge } from './StreakBadge';
import { format, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StreakDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const StreakDialog = ({ children, open, onOpenChange }: StreakDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { streak, isLoading, checkInToday, isUpdating } = useUserStreak();
  const { data: leaderboard } = useCompanyStreakLeaderboard(10);
  const { data: pointsHistory } = usePointsHistory(undefined, 50);

  const streakTransactions = pointsHistory?.filter(t => 
    t.action_type === 'streak_milestone'
  ) || [];

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const isActiveDay = streak?.last_activity_date && 
        streak.streak_start_date &&
        date >= new Date(streak.streak_start_date) &&
        date <= new Date(streak.last_activity_date);
      
      days.push({
        date,
        isActive: isActiveDay,
        isToday: isToday(date)
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getStreakMilestones = () => {
    const milestones = [
      { days: 7, coins: 50, icon: Calendar },
      { days: 14, coins: 100, icon: Target },
      { days: 30, coins: 300, icon: Award },
      { days: 60, coins: 600, icon: Trophy },
      { days: 100, coins: 1000, icon: Flame },
    ];

    return milestones.map(milestone => ({
      ...milestone,
      achieved: (streak?.longest_streak || 0) >= milestone.days,
      current: (streak?.current_streak || 0) >= milestone.days
    }));
  };

  const milestones = getStreakMilestones();
  const canCheckInToday = streak?.last_activity_date !== new Date().toISOString().split('T')[0];

  // Use controlled or uncontrolled mode
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Sistema de Ofensiva
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{streak?.current_streak || 0}</div>
                <div className="text-sm text-muted-foreground">Ofensiva Atual</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{streak?.longest_streak || 0}</div>
                <div className="text-sm text-muted-foreground">Melhor Ofensiva</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {streak?.streak_start_date ? 
                    Math.floor((Date.now() - new Date(streak.streak_start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1 
                    : 0}
                </div>
                <div className="text-sm text-muted-foreground">Dias Totais</div>
              </div>
            </div>

            {canCheckInToday && (
              <div className="text-center p-4 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-800">
                <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-muted-foreground mb-3">
                  Você ainda não fez seu check-in de hoje!
                </p>
                <Button 
                  onClick={checkInToday} 
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isUpdating ? 'Registrando...' : 'Fazer Check-in'}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold">Como funciona:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Entre na plataforma todos os dias para manter sua ofensiva</li>
                <li>• Se você perder um dia, sua ofensiva será zerada</li>
                <li>• Ganhe moedas ao atingir marcos especiais (7, 14, 30+ dias)</li>
                <li>• Compete com outros usuários no ranking de ofensivas</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Últimos 30 dias</h3>
              <div className="grid grid-cols-10 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square rounded text-xs flex items-center justify-center text-center
                      ${day.isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                    title={format(day.date, 'dd/MM/yyyy', { locale: ptBR })}
                  >
                    {format(day.date, 'd')}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Dia ativo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <span>Dia inativo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Hoje</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Marcos de Recompensa</h3>
              <div className="grid gap-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.days}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border
                      ${milestone.current 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                        : milestone.achieved
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <milestone.icon className={`h-5 w-5 ${
                        milestone.current ? 'text-green-500' :
                        milestone.achieved ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium">{milestone.days} dias consecutivos</div>
                        <div className="text-sm text-muted-foreground">
                          +{milestone.coins} moedas
                        </div>
                      </div>
                    </div>
                    <div>
                      {milestone.current ? (
                        <Badge variant="default" className="bg-green-500">Ativo</Badge>
                      ) : milestone.achieved ? (
                        <Badge variant="secondary">Conquistado</Badge>
                      ) : (
                        <Badge variant="outline">Bloqueado</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {streakTransactions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Recompensas Recebidas</h3>
                  <div className="space-y-2">
                    {streakTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Marco de ofensiva</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-600">+{transaction.coins}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Ranking de Ofensivas</h3>
              <div className="space-y-2">
                {leaderboard?.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.profiles?.first_name} {user.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Melhor: {user.longest_streak} dias
                        </div>
                      </div>
                    </div>
                    <StreakBadge variant="compact" />
                  </div>
                )) || []}
                
                {!leaderboard?.length && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma ofensiva ativa encontrada
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};