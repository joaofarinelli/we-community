import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { toast } from 'sonner';

export const useCreateLessonQuiz = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useSupabaseContext();

  return useMutation({
    mutationFn: async (quizData: {
      lessonId: string;
      title: string;
      description?: string;
      passingScore: number;
      maxAttempts: number;
      timeLimitMinutes?: number;
      questions: Array<{
        questionText: string;
        questionType: 'multiple_choice' | 'true_false' | 'text';
        points: number;
        explanation?: string;
        options?: Array<{
          optionText: string;
          isCorrect: boolean;
        }>;
      }>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('lesson_quizzes')
        .insert({
          lesson_id: quizData.lessonId,
          title: quizData.title,
          description: quizData.description,
          passing_score: quizData.passingScore,
          max_attempts: quizData.maxAttempts,
          time_limit_minutes: quizData.timeLimitMinutes,
          created_by: user.id
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and options
      for (let i = 0; i < quizData.questions.length; i++) {
        const questionData = quizData.questions[i];
        
        const { data: question, error: questionError } = await supabase
          .from('lesson_quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: questionData.questionText,
            question_type: questionData.questionType,
            points: questionData.points,
            explanation: questionData.explanation,
            order_index: i
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options for multiple choice and true/false questions
        if (questionData.options && questionData.options.length > 0) {
          const optionsToInsert = questionData.options.map((option, optionIndex) => ({
            question_id: question.id,
            option_text: option.optionText,
            is_correct: option.isCorrect,
            order_index: optionIndex
          }));

          const { error: optionsError } = await supabase
            .from('lesson_quiz_options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz'] });
      toast.success('Prova criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar prova: ' + error.message);
    }
  });
};

export const useUpdateLessonQuiz = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useSupabaseContext();

  return useMutation({
    mutationFn: async (quizData: {
      quizId: string;
      title: string;
      description?: string;
      passingScore: number;
      maxAttempts: number;
      timeLimitMinutes?: number;
      questions: Array<{
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
      }>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update the quiz
      const { error: quizError } = await supabase
        .from('lesson_quizzes')
        .update({
          title: quizData.title,
          description: quizData.description,
          passing_score: quizData.passingScore,
          max_attempts: quizData.maxAttempts,
          time_limit_minutes: quizData.timeLimitMinutes
        })
        .eq('id', quizData.quizId);

      if (quizError) throw quizError;

      // Delete existing questions and options
      const { error: deleteError } = await supabase
        .from('lesson_quiz_questions')
        .delete()
        .eq('quiz_id', quizData.quizId);

      if (deleteError) throw deleteError;

      // Create new questions and options
      for (let i = 0; i < quizData.questions.length; i++) {
        const questionData = quizData.questions[i];
        
        const { data: question, error: questionError } = await supabase
          .from('lesson_quiz_questions')
          .insert({
            quiz_id: quizData.quizId,
            question_text: questionData.questionText,
            question_type: questionData.questionType,
            points: questionData.points,
            explanation: questionData.explanation,
            order_index: i
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options for multiple choice and true/false questions
        if (questionData.options && questionData.options.length > 0) {
          const optionsToInsert = questionData.options.map((option, optionIndex) => ({
            question_id: question.id,
            option_text: option.optionText,
            is_correct: option.isCorrect,
            order_index: optionIndex
          }));

          const { error: optionsError } = await supabase
            .from('lesson_quiz_options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz'] });
      toast.success('Prova atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar prova: ' + error.message);
    }
  });
};

export const useDeleteLessonQuiz = () => {
  const queryClient = useQueryClient();
  useSupabaseContext();

  return useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('lesson_quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-quiz'] });
      toast.success('Prova removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover prova: ' + error.message);
    }
  });
};