import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { toast } from 'sonner';

export const useLessonQuiz = (lessonId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: async () => {
      if (!user?.id || !lessonId) throw new Error('Missing user or lesson ID');
      
      // Step 1: Fetch the quiz record only (avoid nested selects that require FK relationships)
      const { data: quizRow, error: quizError } = await supabase
        .from('lesson_quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .maybeSingle();
        
      if (quizError) throw quizError;
      if (!quizRow) return null;

      // Step 2: Fetch questions for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('lesson_quiz_questions')
        .select('*')
        .eq('quiz_id', quizRow.id)
        .order('order_index', { ascending: true });
      if (questionsError) throw questionsError;

      // Step 3: Fetch options for these questions (if any questions exist)
      let options: any[] = [];
      if (questions && questions.length > 0) {
        const { data: opts, error: optionsError } = await supabase
          .from('lesson_quiz_options')
          .select('*')
          .in('question_id', questions.map(q => q.id));
        if (optionsError) throw optionsError;
        options = opts || [];
      }

      // Shape the result to match previous structure
      const quizWithRelations = {
        ...quizRow,
        lesson_quiz_questions: (questions || []).map(q => ({
          ...q,
          lesson_quiz_options: options.filter(o => o.question_id === q.id)
        }))
      };

      return quizWithRelations as any;
    },
    enabled: !!user?.id && !!lessonId
  });
};

export const useQuizAttempts = (quizId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['quiz-attempts', quizId, user?.id],
    queryFn: async () => {
      if (!user?.id || !quizId) throw new Error('Missing user or quiz ID');
      
      const { data, error } = await supabase
        .from('lesson_quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!quizId
  });
};

export const useStartQuizAttempt = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useSupabaseContext();

  return useMutation({
    mutationFn: async ({ quizId, companyId }: { quizId: string; companyId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current attempt count
      const { data: attempts } = await supabase
        .from('lesson_quiz_attempts')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const nextAttemptNumber = attempts?.length ? attempts[0].attempt_number + 1 : 1;

      const { data, error } = await supabase
        .from('lesson_quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          company_id: companyId,
          max_score: 0, // Will be updated when submitted
          attempt_number: nextAttemptNumber
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
    onError: (error) => {
      toast.error('Erro ao iniciar prova: ' + error.message);
    }
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attemptId, answers }: { 
      attemptId: string; 
      answers: Array<{
        questionId: string;
        selectedOptionId?: string;
        textAnswer?: string;
      }>;
    }) => {
      const { data, error } = await supabase.functions.invoke('submit-lesson-quiz', {
        body: { attemptId, answers }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      
      if (data.passed) {
        toast.success('Parabéns! Você passou na prova!');
      } else if (data.needsReview) {
        toast.success('Prova enviada! Aguarde a correção das questões dissertativas.');
      } else {
        toast.error(`Você não atingiu a nota mínima. Pontuação: ${data.score}/${data.maxScore}`);
      }
    },
    onError: (error) => {
      toast.error('Erro ao enviar prova: ' + error.message);
    }
  });
};