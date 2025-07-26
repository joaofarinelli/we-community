import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Trophy, Award, CheckCircle, Clock } from 'lucide-react';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useUserCoins } from '@/hooks/useUserPoints';
import { usePointsHistory } from '@/hooks/usePointsHistory';

interface CourseRewardsSummaryProps {
  courseId: string;
  totalLessons: number;
  totalModules: number;
}

export const CourseRewardsSummary = ({ 
  courseId, 
  totalLessons, 
  totalModules 
}: CourseRewardsSummaryProps) => {
  const { data: userProgress } = useUserCourseProgress(courseId);
  const { data: userCoins } = useUserCoins();
  const { data: pointsHistory } = usePointsHistory();

  const completedLessons = userProgress?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Calculate rewards from this course
  const courseRewards = pointsHistory?.filter(
    transaction => 
      transaction.action_type.includes('lesson_complete') ||
      transaction.action_type.includes('module_complete') ||
      transaction.action_type.includes('course_complete')
  ) || [];

  const totalCoinsFromCourse = courseRewards.reduce((sum, reward) => sum + reward.coins, 0);

  const lessonRewards = courseRewards.filter(r => r.action_type === 'lesson_complete').length;
  const moduleRewards = courseRewards.filter(r => r.action_type === 'module_complete').length;
  const courseRewards_complete = courseRewards.filter(r => r.action_type === 'course_complete').length;

  const estimatedTotalReward = (totalLessons * 15) + (totalModules * 50) + 200; // Base rewards

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Recompensas do Curso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {completedLessons}/{totalLessons} lições
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progressPercentage)}% completo
          </p>
        </div>

        {/* Current Coins */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-medium">Moedas Totais</span>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {userCoins?.total_coins || 0}
          </Badge>
        </div>

        {/* Course Rewards Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recompensas deste Curso</h4>
          
          <div className="space-y-2">
            {/* Lesson Rewards */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Lições Completadas</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{lessonRewards} × 15</span>
                <Coins className="h-3 w-3 text-primary" />
                <span className="font-medium">{lessonRewards * 15}</span>
              </div>
            </div>

            {/* Module Rewards */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-blue-500" />
                <span>Módulos Completados</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{moduleRewards} × 50</span>
                <Coins className="h-3 w-3 text-primary" />
                <span className="font-medium">{moduleRewards * 50}</span>
              </div>
            </div>

            {/* Course Completion */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3 text-amber-500" />
                <span>Curso Completo</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{courseRewards_complete} × 200</span>
                <Coins className="h-3 w-3 text-primary" />
                <span className="font-medium">{courseRewards_complete * 200}</span>
              </div>
            </div>
          </div>

          {/* Total from Course */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between font-medium">
              <span>Total do Curso</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-lg">{totalCoinsFromCourse}</span>
              </div>
            </div>
          </div>

          {/* Potential Rewards */}
          {progressPercentage < 100 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Potencial Total</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{estimatedTotalReward}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete todas as lições para ganhar o máximo de recompensas!
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};