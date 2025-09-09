import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { toast } from 'sonner';

export const usePendingEssayReviews = (companyId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['pending-essay-reviews', companyId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lesson_quiz_answers')
        .select(`
          *,
          lesson_quiz_attempts!inner(
            user_id,
            quiz_id,
            company_id,
            attempt_number,
            started_at,
            profiles!lesson_quiz_attempts_user_id_fkey(
              first_name,
              last_name,
              email
            ),
            lesson_quizzes!inner(
              title,
              lesson_id,
              course_lessons!inner(
                title,
                course_modules!inner(
                  title,
                  courses!inner(
                    title
                  )
                )
              )
            )
          ),
          lesson_quiz_questions!inner(
            question_text,
            question_type,
            points
          )
        `)
        .eq('review_status', 'pending')
        .eq('lesson_quiz_attempts.company_id', companyId || '')
        .not('text_answer', 'is', null)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!companyId
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
      toast.success(`Resposta ${data.review_status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro ao revisar resposta: ' + error.message);
    }
  });
};

export const useCompanyEssayReviews = (companyId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['company-essay-reviews', companyId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lesson_quiz_answers')
        .select(`
          *,
          lesson_quiz_attempts!inner(
            user_id,
            quiz_id,
            company_id,
            attempt_number,
            started_at,
            profiles!lesson_quiz_attempts_user_id_fkey(
              first_name,
              last_name,
              email
            ),
            lesson_quizzes!inner(
              title,
              lesson_id,
              course_lessons!inner(
                title,
                course_modules!inner(
                  title,
                  courses!inner(
                    title
                  )
                )
              )
            )
          ),
          lesson_quiz_questions!inner(
            question_text,
            question_type,
            points
          ),
          profiles!lesson_quiz_answers_reviewed_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq('lesson_quiz_attempts.company_id', companyId || '')
        .not('text_answer', 'is', null)
        .in('review_status', ['approved', 'rejected', 'pending'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!companyId
  });
};