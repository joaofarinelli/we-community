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
      className="gap-1"
    >
      <FileText className="h-4 w-4" />
      {quiz ? 'Editar Prova' : 'Criar Prova'}
    </Button>
  );
};