import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { toast } from 'sonner';

// Temporary type definitions until Supabase types are regenerated
interface LessonQuizQuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  text_answer: string;
  review_status: string;  
  review_notes?: string;
  points_earned: number;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  company_id: string;
}

export interface EssayAnswer {
  id: string;
  user_id: string;
  text_answer: string;
  review_status: string;
  review_notes?: string;
  points_earned: number;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  attempt_id: string;
  question_id: string;
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
  quiz_id?: string;
  lesson_id?: string;  
  module_id?: string;
  course_id?: string;
  updated_at?: string;
}

export interface EssayReviewFilters {
  userName?: string;
  tagIds?: string[];
  levelIds?: string[];
  badgeIds?: string[];
}

export const usePendingEssayReviews = (companyId?: string, page = 0, limit = 20, filters?: EssayReviewFilters) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['pending-essay-reviews', companyId, page, limit, filters],
    queryFn: async (): Promise<{ data: EssayAnswer[], count: number }> => {
      if (!user?.id || !companyId) throw new Error('User not authenticated or no company');
      
      console.log('Fetching pending essay reviews:', { companyId, page, limit, filters });

      // Build query for data - using type assertion since table types are not updated yet
      const { data, error } = await (supabase as any)
        .from('lesson_quiz_question_attempts')
        .select(`
          id,
          user_id,
          text_answer,
          review_status,
          review_notes,
          points_earned,
          reviewed_at,
          reviewed_by,
          created_at,
          updated_at,
          lesson_quiz_questions!inner (
            id,
            question_text,
            points,
            lesson_quizzes!inner (
              id,
              title,
              lesson_id,
              course_lessons!inner (
                id,
                title,
                module_id,
                course_modules!inner (
                  id,
                  title,
                  course_id,
                  courses!inner (
                    id,
                    title,
                    company_id
                  )
                )
              )
            )
          ),
          profiles!lesson_quiz_question_attempts_user_id_fkey (
            first_name,
            last_name,
            user_id
          ),
          profiles!lesson_quiz_question_attempts_reviewed_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('review_status', 'pending')
        .neq('text_answer', '')
        .not('text_answer', 'is', null)
        .eq('lesson_quiz_questions.lesson_quizzes.course_lessons.course_modules.courses.company_id', companyId)
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let transformedData: EssayAnswer[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        user_name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || 'Usuário',
        user_email: item.profiles?.email || '',
        text_answer: item.text_answer,
        review_status: item.review_status,
        review_notes: item.review_notes,
        points_earned: item.points_earned,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        reviewer_name: item.profiles?.first_name && item.profiles?.last_name
          ? `${item.profiles.first_name} ${item.profiles.last_name}`
          : undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        question_id: item.lesson_quiz_questions.id,
        question_text: item.lesson_quiz_questions.question_text,
        question_points: item.lesson_quiz_questions.points,
        quiz_id: item.lesson_quiz_questions.lesson_quizzes.id,
        quiz_title: item.lesson_quiz_questions.lesson_quizzes.title,
        lesson_id: item.lesson_quiz_questions.lesson_quizzes.lesson_id,
        lesson_title: item.lesson_quiz_questions.lesson_quizzes.course_lessons.title,
        module_id: item.lesson_quiz_questions.lesson_quizzes.course_lessons.module_id,
        module_title: item.lesson_quiz_questions.lesson_quizzes.course_lessons.course_modules.title,
        course_id: item.lesson_quiz_questions.lesson_quizzes.course_lessons.course_modules.course_id,
        course_title: item.lesson_quiz_questions.lesson_quizzes.course_lessons.course_modules.courses.title,
        attempt_id: '',
        attempt_number: 0,
        started_at: ''
      }));

      // Apply client-side filters
      if (filters?.userName) {
        const searchLower = filters.userName.toLowerCase();
        transformedData = transformedData.filter(item => 
          item.user_name.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.tagIds?.length || filters?.levelIds?.length || filters?.badgeIds?.length) {
        const userIds = [...new Set(transformedData.map(item => item.user_id))];
        
        if (userIds.length > 0) {
          // Get user tags if filtering by tags
          let hasValidUsers = true;
          
          if (filters.tagIds?.length) {
            const { data: userTags } = await supabase
              .from('user_tags')
              .select('user_id, tag_id')
              .in('user_id', userIds)
              .in('tag_id', filters.tagIds);

            const validUserIds = new Set(userTags?.map(ut => ut.user_id) || []);
            transformedData = transformedData.filter(item => validUserIds.has(item.user_id));
          }

          if (filters.levelIds?.length && transformedData.length > 0) {
            const { data: userLevels } = await supabase
              .from('user_current_level')
              .select('user_id, current_level_id')
              .in('user_id', transformedData.map(item => item.user_id))
              .in('current_level_id', filters.levelIds);

            const validUserIds = new Set(userLevels?.map(ul => ul.user_id) || []);
            transformedData = transformedData.filter(item => validUserIds.has(item.user_id));
          }

          if (filters.badgeIds?.length && transformedData.length > 0) {
            const { data: userBadges } = await supabase
              .from('user_trail_badges')
              .select('user_id, badge_id')
              .in('user_id', transformedData.map(item => item.user_id))
              .in('badge_id', filters.badgeIds);

            const validUserIds = new Set(userBadges?.map(ub => ub.user_id) || []);
            transformedData = transformedData.filter(item => validUserIds.has(item.user_id));
          }
        }
      }

      return { data: transformedData, count: transformedData.length };
    },
    enabled: !!user?.id && !!companyId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

export const useReviewEssayAnswer = () => {
  const queryClient = useQueryClient();

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
      const { data, error } = await supabase.rpc('review_essay_answer', {
        p_answer_id: answerId,
        p_review_status: reviewStatus,
        p_review_notes: reviewNotes,
        p_points_earned: pointsEarned || 0
      });

      if (error) throw error;
      return data as { review_status: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-essay-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['company-essay-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews-count'] });
      
      const statusText = (data as any)?.review_status === 'approved' ? 'aprovada' : 'rejeitada';
      toast.success(`Resposta ${statusText} com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro ao revisar resposta: ' + error.message);
    }
  });
};

export const useCompanyEssayReviews = (companyId?: string, page = 0, limit = 20, filters?: EssayReviewFilters) => {
  const { user } = useAuth();
  useSupabaseContext();
  
  return useQuery({
    queryKey: ['company-essay-reviews', companyId, page, limit, filters],
    queryFn: async (): Promise<{ data: EssayAnswer[], count: number }> => {
      if (!user?.id || !companyId) throw new Error('User not authenticated or no company');
      
      // For now return empty data - this would need the same filter implementation as pending reviews
      return { data: [], count: 0 };
    },
    enabled: !!user?.id && !!companyId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const usePendingReviewsCount = (companyId?: string) => {
  const { user } = useAuth();
  useSupabaseContext();

  return useQuery({
    queryKey: ['pending-reviews-count', companyId],
    queryFn: async (): Promise<number> => {
      if (!user?.id || !companyId) return 0;

      const { count, error } = await (supabase as any)
        .from('lesson_quiz_question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'pending')
        .neq('text_answer', '')
        .not('text_answer', 'is', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && !!companyId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};