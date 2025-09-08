import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface QuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
}

interface QuizSubmission {
  attemptId: string;
  answers: QuizAnswer[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { attemptId, answers }: QuizSubmission = await req.json();

    console.log('Processing quiz submission for attempt:', attemptId);

    // Get the quiz attempt details
    const { data: attempt, error: attemptError } = await supabase
      .from('lesson_quiz_attempts')
      .select(`
        *,
        lesson_quizzes!inner(
          *,
          course_lessons!inner(
            *,
            course_modules!inner(
              *,
              courses!inner(*)
            )
          )
        )
      `)
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      throw new Error('Quiz attempt not found or not accessible');
    }

    // Get all quiz questions with options
    const { data: questions, error: questionsError } = await supabase
      .from('lesson_quiz_questions')
      .select(`
        *,
        lesson_quiz_options(*)
      `)
      .eq('quiz_id', attempt.quiz_id)
      .order('order_index');

    if (questionsError) {
      throw new Error('Failed to load quiz questions');
    }

    let totalScore = 0;
    let maxScore = 0;
    let hasTextQuestions = false;

    // Process each answer
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      maxScore += question.points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        // Find the selected option
        const selectedOption = question.lesson_quiz_options.find(
          opt => opt.id === answer.selectedOptionId
        );
        
        if (selectedOption && selectedOption.is_correct) {
          isCorrect = true;
          pointsEarned = question.points;
          totalScore += pointsEarned;
        }
      } else if (question.question_type === 'text') {
        hasTextQuestions = true;
        // Text questions need manual review
        isCorrect = null;
        pointsEarned = 0;
      }

      // Insert the answer
      const { error: answerError } = await supabase
        .from('lesson_quiz_answers')
        .insert({
          attempt_id: attemptId,
          question_id: answer.questionId,
          selected_option_id: answer.selectedOptionId || null,
          text_answer: answer.textAnswer || null,
          is_correct: isCorrect,
          points_earned: pointsEarned
        });

      if (answerError) {
        console.error('Error inserting answer:', answerError);
      }
    }

    // Determine final status
    let finalStatus = 'completed';
    if (hasTextQuestions) {
      finalStatus = 'pending_review';
    }

    // Update the attempt
    const { error: updateError } = await supabase
      .from('lesson_quiz_attempts')
      .update({
        score: hasTextQuestions ? null : totalScore,
        max_score: maxScore,
        status: finalStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (updateError) {
      throw new Error('Failed to update quiz attempt');
    }

    // Check if user passed and mark lesson as complete if they did
    const passingScore = attempt.lesson_quizzes.passing_score || 70;
    const scorePercentage = hasTextQuestions ? 0 : (totalScore / maxScore) * 100;
    const passed = !hasTextQuestions && scorePercentage >= passingScore;

    if (passed) {
      // Check if lesson is already completed
      const { data: existingProgress } = await supabase
        .from('user_course_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', attempt.lesson_quizzes.lesson_id)
        .maybeSingle();

      if (!existingProgress) {
        // Mark lesson as completed
        const { error: progressError } = await supabase
          .from('user_course_progress')
          .insert({
            user_id: user.id,
            lesson_id: attempt.lesson_quizzes.lesson_id,
            module_id: attempt.lesson_quizzes.course_lessons.module_id,
            course_id: attempt.lesson_quizzes.course_lessons.course_modules.course_id
          });

        if (progressError) {
          console.error('Error marking lesson as complete:', progressError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: hasTextQuestions ? null : totalScore,
        maxScore,
        percentage: hasTextQuestions ? null : scorePercentage,
        passed,
        status: finalStatus,
        needsReview: hasTextQuestions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});