import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useCreateLessonQuiz, useUpdateLessonQuiz } from '@/hooks/useManageLessonQuizzes';

interface Question {
  id?: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'text';
  points: number;
  explanation?: string;
  options?: Array<{
    id?: string;
    optionText: string;
    isCorrect: boolean;
  }>;
}

interface LessonQuizEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  quiz?: any;
}

export const LessonQuizEditor = ({ 
  open, 
  onOpenChange, 
  lessonId,
  quiz 
}: LessonQuizEditorProps) => {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [passingScore, setPassingScore] = useState(quiz?.passing_score || 70);
  const [maxAttempts, setMaxAttempts] = useState(quiz?.max_attempts || 3);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(quiz?.time_limit_minutes || '');
  const [questions, setQuestions] = useState<Question[]>(
    quiz?.lesson_quiz_questions?.map((q: any) => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type,
      points: q.points,
      explanation: q.explanation,
      options: q.lesson_quiz_options?.map((o: any) => ({
        id: o.id,
        optionText: o.option_text,
        isCorrect: o.is_correct
      })) || []
    })) || []
  );

  const createQuiz = useCreateLessonQuiz();
  const updateQuiz = useUpdateLessonQuiz();

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: '',
      questionType: 'multiple_choice',
      points: 1,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset options when question type changes
    if (field === 'questionType') {
      if (value === 'multiple_choice') {
        updated[index].options = [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ];
      } else if (value === 'true_false') {
        updated[index].options = [
          { optionText: 'Verdadeiro', isCorrect: false },
          { optionText: 'Falso', isCorrect: false }
        ];
      } else {
        updated[index].options = [];
      }
    }
    
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options?.push({ optionText: '', isCorrect: false });
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = {
        ...updated[questionIndex].options![optionIndex],
        [field]: value
      };
    }
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options?.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim() || questions.length === 0) {
      return;
    }

    try {
      if (quiz) {
        await updateQuiz.mutateAsync({
          quizId: quiz.id,
          title,
          description,
          passingScore,
          maxAttempts,
          timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : undefined,
          questions
        });
      } else {
        await createQuiz.mutateAsync({
          lessonId,
          title,
          description,
          passingScore,
          maxAttempts,
          timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : undefined,
          questions
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quiz ? 'Editar Prova' : 'Criar Prova'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Prova</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título da prova"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional da prova"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="passingScore">Nota Mínima (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxAttempts">Máximo de Tentativas</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="timeLimit">Tempo Limite (min)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min="1"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questões</CardTitle>
              <Button onClick={addQuestion} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Questão
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Questão {questionIndex + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Pergunta</Label>
                      <Textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                        placeholder="Digite a pergunta"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Questão</Label>
                        <Select
                          value={question.questionType}
                          onValueChange={(value) => updateQuestion(questionIndex, 'questionType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                            <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                            <SelectItem value="text">Dissertativa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Pontos</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Options */}
                    {(question.questionType === 'multiple_choice' || question.questionType === 'true_false') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Opções</Label>
                          {question.questionType === 'multiple_choice' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(questionIndex)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Opção
                            </Button>
                          )}
                        </div>

                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Checkbox
                              checked={option.isCorrect}
                              onCheckedChange={(checked) => 
                                updateOption(questionIndex, optionIndex, 'isCorrect', checked)
                              }
                            />
                            <Input
                              value={option.optionText}
                              onChange={(e) => 
                                updateOption(questionIndex, optionIndex, 'optionText', e.target.value)
                              }
                              placeholder="Digite o texto da opção"
                              className="flex-1"
                              disabled={question.questionType === 'true_false'}
                            />
                            {question.questionType === 'multiple_choice' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label>Explicação (Opcional)</Label>
                      <Textarea
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                        placeholder="Explicação que será mostrada após a resposta"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma questão adicionada. Clique em "Adicionar Questão" para começar.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || questions.length === 0 || createQuiz.isPending || updateQuiz.isPending}
            >
              {(createQuiz.isPending || updateQuiz.isPending) ? 'Salvando...' : 'Salvar Prova'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};