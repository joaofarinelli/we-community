import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useLessonQuiz } from '@/hooks/useLessonQuiz';

interface QuizButtonProps {
  lessonId: string;
  onManageQuiz: () => void;
}

export const QuizButton = ({ lessonId, onManageQuiz }: QuizButtonProps) => {
  const { data: quiz } = useLessonQuiz(lessonId);

  return (
    <Button
      variant={quiz ? "default" : "outline"}
      size="sm"
      onClick={onManageQuiz}
      className="text-xs h-8 px-2"
      title={quiz ? "Editar Prova" : "Criar Prova"}
    >
      <FileText className="h-3 w-3 sm:mr-1" />
      <span className="hidden sm:inline">{quiz ? 'Prova' : 'Prova'}</span>
    </Button>
  );
};