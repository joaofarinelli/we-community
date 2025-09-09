import { usePendingReviewsCount } from '@/hooks/useEssayQuestionReviews';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, ArrowRight } from 'lucide-react';

export const PendingReviewsNotification = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const navigate = useNavigate();
  useSupabaseContext();
  
  const { data: pendingCount, isLoading } = usePendingReviewsCount(currentCompanyId);

  if (isLoading || !pendingCount || pendingCount === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base text-orange-800 dark:text-orange-200">
                Questões Dissertativas Pendentes
              </CardTitle>
              <CardDescription className="text-orange-600 dark:text-orange-400">
                Há {pendingCount} {pendingCount === 1 ? 'resposta pendente' : 'respostas pendentes'} de revisão
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
            <Clock className="w-3 h-3 mr-1" />
            {pendingCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Clique para revisar e aprovar/rejeitar as respostas dos alunos.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/quiz-reviews')}
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
          >
            Revisar Agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};