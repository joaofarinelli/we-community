import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { toast } from 'sonner';

interface EssayAnswer {
  id: string;
  text_answer: string;
  review_status: string;
  review_notes?: string;
  points_earned: number;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  attempt_id: string;
  question_id: string;
  // Additional data
  user_name: string;
  user_email: string;
  course_title: string;
  module_title: string;
  lesson_title: string;
  quiz_title: string;
  question_text: string;
  question_points: number;
  attempt_number: number;
  started_at: string;
  reviewer_name?: string;
}

export const usePendingEssayReviews = (companyId?: string, page = 0, limit = 20) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['pending-essay-reviews', companyId, page, limit],
    queryFn: async (): Promise<{ data: EssayAnswer[], count: number }> => {
      if (!user?.id || !companyId) throw new Error('User not authenticated or no company');
      
      // First get the basic quiz answers with minimal joins
      const { data: answers, error: answersError, count } = await supabase
        .from('lesson_quiz_answers')
        .select(`
          id,
          text_answer,
          review_status,
          review_notes,
          points_earned,
          created_at,
          reviewed_at,
          reviewed_by,
          attempt_id,
          question_id
        `, { count: 'exact' })
        .eq('review_status', 'pending')
        .not('text_answer', 'is', null)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
        
      if (answersError) throw answersError;
      if (!answers || answers.length === 0) {
        return { data: [], count: count || 0 };
      }

      // Get attempt details
      const attemptIds = answers.map(a => a.attempt_id);
      const { data: attempts, error: attemptsError } = await supabase
        .from('lesson_quiz_attempts')
        .select('id, user_id, quiz_id, attempt_number, started_at, company_id')
        .in('id', attemptIds)
        .eq('company_id', companyId);

      if (attemptsError) throw attemptsError;

      // Get question details
      const questionIds = answers.map(a => a.question_id);
      const { data: questions, error: questionsError } = await supabase
        .from('lesson_quiz_questions')
        .select('id, question_text, points')
        .in('id', questionIds);

      if (questionsError) throw questionsError;

      // Get user profiles
      const userIds = attempts?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Get quiz and course information
      const quizIds = attempts?.map(a => a.quiz_id) || [];
      const { data: quizzes } = await supabase
        .from('lesson_quizzes')
        .select(`
          id,
          title,
          lesson_id
        `)
        .in('id', quizIds);

      // Get course structure
      const lessonIds = quizzes?.map(q => q.lesson_id) || [];
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select(`
          id,
          title,
          module_id
        `)
        .in('id', lessonIds);

      const moduleIds = lessons?.map(l => l.module_id) || [];
      const { data: modules } = await supabase
        .from('course_modules')
        .select(`
          id,
          title,
          course_id
        `)
        .in('id', moduleIds);

      const courseIds = modules?.map(m => m.course_id) || [];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      // Create lookup maps
      const attemptMap = new Map<string, any>(attempts?.map(a => [a.id, a]) || []);
      const questionMap = new Map<string, any>(questions?.map(q => [q.id, q]) || []);
      const profileMap = new Map<string, any>(profiles?.map(p => [p.user_id, p]) || []);
      const quizMap = new Map<string, any>(quizzes?.map(q => [q.id, q]) || []);
      const lessonMap = new Map<string, any>(lessons?.map(l => [l.id, l]) || []);
      const moduleMap = new Map<string, any>(modules?.map(m => [m.id, m]) || []);
      const courseMap = new Map<string, any>(courses?.map(c => [c.id, c]) || []);

      // Transform data
      const transformedData: EssayAnswer[] = answers.map(answer => {
        const attempt = attemptMap.get(answer.attempt_id);
        const question = questionMap.get(answer.question_id);
        const profile = attempt ? profileMap.get(attempt.user_id) : null;
        const quiz = attempt ? quizMap.get(attempt.quiz_id) : null;
        const lesson = quiz ? lessonMap.get(quiz.lesson_id) : null;
        const module = lesson ? moduleMap.get(lesson.module_id) : null;
        const course = module ? courseMap.get(module.course_id) : null;

        return {
          id: answer.id,
          text_answer: answer.text_answer,
          review_status: answer.review_status,
          review_notes: answer.review_notes,
          points_earned: answer.points_earned,
          created_at: answer.created_at,
          reviewed_at: answer.reviewed_at,
          reviewed_by: answer.reviewed_by,
          attempt_id: answer.attempt_id,
          question_id: answer.question_id,
          user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Usuário desconhecido',
          user_email: profile?.email || '',
          course_title: course?.title || 'Curso desconhecido',
          module_title: module?.title || 'Módulo desconhecido',
          lesson_title: lesson?.title || 'Aula desconhecida',
          quiz_title: quiz?.title || 'Prova desconhecida',
          question_text: question?.question_text || 'Pergunta não encontrada',
          question_points: question?.points || 0,
          attempt_number: attempt?.attempt_number || 0,
          started_at: attempt?.started_at || '',
          reviewer_name: undefined
        };
      });

      return { data: transformedData, count: count || 0 };
    },
    enabled: !!user?.id && !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useReviewEssayAnswer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  useSupabaseContext();

  return useMutation({
    mutationFn: async ({ 
      answerId, 
      reviewStatus, 
      reviewNotes,
      pointsEarned 
    }: { 
      answerId: string; 
      reviewStatus: 'approved' | 'rejected';
      reviewNotes?: string;
      pointsEarned?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lesson_quiz_answers')
        .update({
          review_status: reviewStatus,
          review_notes: reviewNotes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          is_correct: reviewStatus === 'approved',
          points_earned: pointsEarned || 0
        })
        .eq('id', answerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-essay-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['company-essay-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews-count'] });
      toast.success(`Resposta ${data.review_status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro ao revisar resposta: ' + error.message);
    }
  });
};

export const useCompanyEssayReviews = (companyId?: string, page = 0, limit = 20) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['company-essay-reviews', companyId, page, limit],
    queryFn: async (): Promise<{ data: EssayAnswer[], count: number }> => {
      if (!user?.id || !companyId) throw new Error('User not authenticated or no company');
      
      // Similar optimized approach for all reviews
      const { data: answers, error: answersError, count } = await supabase
        .from('lesson_quiz_answers')
        .select(`
          id,
          text_answer,
          review_status,
          review_notes,
          points_earned,
          created_at,
          reviewed_at,
          reviewed_by,
          attempt_id,
          question_id
        `, { count: 'exact' })
        .not('text_answer', 'is', null)
        .in('review_status', ['approved', 'rejected', 'pending'])
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
        
      if (answersError) throw answersError;
      if (!answers || answers.length === 0) {
        return { data: [], count: count || 0 };
      }

      // Get attempt details filtered by company
      const attemptIds = answers.map(a => a.attempt_id);
      const { data: attempts, error: attemptsError } = await supabase
        .from('lesson_quiz_attempts')
        .select('id, user_id, quiz_id, attempt_number, started_at, company_id')
        .in('id', attemptIds)
        .eq('company_id', companyId);

      if (attemptsError) throw attemptsError;

      // Filter answers to only include those from this company
      const validAttemptIds = new Set(attempts?.map(a => a.id) || []);
      const filteredAnswers = answers.filter(a => validAttemptIds.has(a.attempt_id));

      if (filteredAnswers.length === 0) {
        return { data: [], count: 0 };
      }

      // Get remaining data like in pending reviews
      const questionIds = filteredAnswers.map(a => a.question_id);
      const { data: questions } = await supabase
        .from('lesson_quiz_questions')
        .select('id, question_text, points')
        .in('id', questionIds);

      const userIds = attempts?.map(a => a.user_id) || [];
      const reviewerIds = filteredAnswers.map(a => a.reviewed_by).filter(Boolean);

      const [profilesResult, reviewersResult] = await Promise.all([
        supabase.from('profiles').select('user_id, first_name, last_name, email').in('user_id', userIds),
        reviewerIds.length > 0 ? supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', reviewerIds) : { data: [] }
      ]);

      // Get course structure
      const quizIds = attempts?.map(a => a.quiz_id) || [];
      const { data: quizzes } = await supabase
        .from('lesson_quizzes')
        .select('id, title, lesson_id')
        .in('id', quizIds);

      const lessonIds = quizzes?.map(q => q.lesson_id) || [];
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title, module_id')
        .in('id', lessonIds);

      const moduleIds = lessons?.map(l => l.module_id) || [];
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id, title, course_id')
        .in('id', moduleIds);

      const courseIds = modules?.map(m => m.course_id) || [];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      // Create lookup maps
      const attemptMap = new Map<string, any>(attempts?.map(a => [a.id, a]) || []);
      const questionMap = new Map<string, any>(questions?.map(q => [q.id, q]) || []);
      const profileMap = new Map<string, any>(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const reviewerMap = new Map<string, any>((reviewersResult as any).data?.map((r: any) => [r.user_id, r]) || []);
      const quizMap = new Map<string, any>(quizzes?.map(q => [q.id, q]) || []);
      const lessonMap = new Map<string, any>(lessons?.map(l => [l.id, l]) || []);
      const moduleMap = new Map<string, any>(modules?.map(m => [m.id, m]) || []);
      const courseMap = new Map<string, any>(courses?.map(c => [c.id, c]) || []);

      // Transform data
      const transformedData: EssayAnswer[] = filteredAnswers.map(answer => {
        const attempt = attemptMap.get(answer.attempt_id);
        const question = questionMap.get(answer.question_id);
        const profile = attempt ? profileMap.get(attempt.user_id) : null;
        const reviewer = answer.reviewed_by ? reviewerMap.get(answer.reviewed_by) : null;
        const quiz = attempt ? quizMap.get(attempt.quiz_id) : null;
        const lesson = quiz ? lessonMap.get(quiz.lesson_id) : null;
        const module = lesson ? moduleMap.get(lesson.module_id) : null;
        const course = module ? courseMap.get(module.course_id) : null;

        return {
          id: answer.id,
          text_answer: answer.text_answer,
          review_status: answer.review_status,
          review_notes: answer.review_notes,
          points_earned: answer.points_earned,
          created_at: answer.created_at,
          reviewed_at: answer.reviewed_at,
          reviewed_by: answer.reviewed_by,
          attempt_id: answer.attempt_id,
          question_id: answer.question_id,
          user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Usuário desconhecido',
          user_email: profile?.email || '',
          course_title: course?.title || 'Curso desconhecido',
          module_title: module?.title || 'Módulo desconhecido',
          lesson_title: lesson?.title || 'Aula desconhecida',
          quiz_title: quiz?.title || 'Prova desconhecida',
          question_text: question?.question_text || 'Pergunta não encontrada',
          question_points: question?.points || 0,
          attempt_number: attempt?.attempt_number || 0,
          started_at: attempt?.started_at || '',
          reviewer_name: reviewer ? `${(reviewer as any).first_name || ''} ${(reviewer as any).last_name || ''}`.trim() : undefined
        };
      });

      return { data: transformedData, count: filteredAnswers.length };
    },
    enabled: !!user?.id && !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Lightweight hook for counting pending reviews
export const usePendingReviewsCount = (companyId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['pending-reviews-count', companyId],
    queryFn: async (): Promise<number> => {
      if (!user?.id || !companyId) return 0;
      
      // Get pending answers first
      const { data: pendingAnswers } = await supabase
        .from('lesson_quiz_answers')
        .select('attempt_id')
        .eq('review_status', 'pending')
        .not('text_answer', 'is', null);

      if (!pendingAnswers || pendingAnswers.length === 0) return 0;

      // Check which attempts belong to this company
      const attemptIds = pendingAnswers.map(a => a.attempt_id);
      const { data: companyAttempts } = await supabase
        .from('lesson_quiz_attempts')
        .select('id')
        .in('id', attemptIds)
        .eq('company_id', companyId);

      const validAttemptIds = new Set(companyAttempts?.map(a => a.id) || []);
      return pendingAnswers.filter(a => validAttemptIds.has(a.attempt_id)).length;
    },
    enabled: !!user?.id && !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 60, // 1 minute
  });
};