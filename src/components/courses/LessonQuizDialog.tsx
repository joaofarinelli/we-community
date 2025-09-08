import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useLessonQuiz, useStartQuizAttempt, useSubmitQuiz, useQuizAttempts } from '@/hooks/useLessonQuiz';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

interface LessonQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  onQuizPassed?: () => void;
}

export const LessonQuizDialog = ({ 
  open, 
  onOpenChange, 
  lessonId,
  onQuizPassed 
}: LessonQuizDialogProps) => {
  const { currentCompanyId } = useCompanyContext();
  const { data: quiz, isLoading: quizLoading } = useLessonQuiz(lessonId);
  const { data: attempts } = useQuizAttempts(quiz?.id);
  const startAttempt = useStartQuizAttempt();
  const submitQuiz = useSubmitQuiz();
  
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Show loading state if dialog is open but quiz data hasn't loaded yet
  if (open && quizLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prova da Aula</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Carregando prova...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quiz) return null;

  const questions = Array.isArray(quiz?.lesson_quiz_questions) ? quiz.lesson_quiz_questions : [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canTakeQuiz = !attempts?.length || attempts.length < (quiz.max_attempts || 3);
  const hasPassedAttempt = attempts?.some(attempt => 
    attempt.status === 'completed' && 
    attempt.score && 
    attempt.max_score &&
    (attempt.score / attempt.max_score) * 100 >= (quiz.passing_score || 70)
  );

  const handleStartQuiz = async () => {
    if (!currentCompanyId) return;
    
    try {
      const attempt = await startAttempt.mutateAsync({
        quizId: quiz.id,
        companyId: currentCompanyId
      });
      setCurrentAttemptId(attempt.id);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentAttemptId) return;

    const formattedAnswers = questions.map(question => ({
      questionId: question.id,
      selectedOptionId: question.question_type !== 'text' ? answers[question.id] : undefined,
      textAnswer: question.question_type === 'text' ? answers[question.id] : undefined
    }));

    try {
      const result = await submitQuiz.mutateAsync({
        attemptId: currentAttemptId,
        answers: formattedAnswers
      });

      if (result.passed && onQuizPassed) {
        onQuizPassed();
      }

      setCurrentAttemptId(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
          <span>{currentQuestion.points} {currentQuestion.points === 1 ? 'ponto' : 'pontos'}</span>
        </div>
        
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{currentQuestion.question_text}</h3>

          {currentQuestion.question_type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.lesson_quiz_options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.lesson_quiz_options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'text' && (
            <Textarea
              placeholder="Digite sua resposta..."
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={4}
            />
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitQuiz.isPending}
            >
              {submitQuiz.isPending ? 'Enviando...' : 'Finalizar Prova'}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Próxima
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {quiz.title}
          </DialogTitle>
        </DialogHeader>

        {!currentAttemptId ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Prova</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quiz.description && (
                  <p className="text-muted-foreground">{quiz.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{questions.length} questões</span>
                  </div>
                  
                  {quiz.time_limit_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.time_limit_minutes} minutos</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Nota mínima: {quiz.passing_score}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>Tentativas: {attempts?.length || 0}/{quiz.max_attempts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {attempts && attempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tentativas Anteriores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attempts.map((attempt, index) => (
                      <div key={attempt.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Tentativa {attempt.attempt_number}</span>
                        <div className="flex items-center gap-2">
                          {attempt.status === 'completed' && attempt.score !== null && (
                            <span className={`text-sm ${
                              (attempt.score / attempt.max_score) * 100 >= (quiz.passing_score || 70)
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {attempt.score}/{attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                            </span>
                          )}
                          {attempt.status === 'pending_review' && (
                            <span className="text-sm text-yellow-600">Aguardando correção</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {hasPassedAttempt ? (
                <Button disabled>
                  Prova já aprovada
                </Button>
              ) : canTakeQuiz ? (
                <Button
                  onClick={handleStartQuiz}
                  disabled={startAttempt.isPending}
                >
                  {startAttempt.isPending ? 'Iniciando...' : 'Iniciar Prova'}
                </Button>
              ) : (
                <Button disabled>
                  Limite de tentativas atingido
                </Button>
              )}
            </div>
          </div>
        ) : (
          renderQuestionContent()
        )}
      </DialogContent>
    </Dialog>
  );
};