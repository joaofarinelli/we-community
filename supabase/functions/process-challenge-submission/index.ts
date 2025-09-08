import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { submissionId } = await req.json()

    if (!submissionId) {
      throw new Error('Submission ID is required')
    }

    console.log('Processing submission:', submissionId)

    // Get submission details with challenge info
    const { data: submission, error: submissionError } = await supabase
      .from('challenge_submissions')
      .select(`
        *,
        user_challenge_participations!inner(
          id,
          challenge_id,
          user_id,
          challenges!inner(
            id,
            title,
            requires_submission_review,
            company_id
          )
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      console.error('Error fetching submission:', submissionError)
      throw new Error('Submission not found')
    }

    const challenge = submission.user_challenge_participations.challenges
    const requiresReview = challenge.requires_submission_review

    console.log('Challenge requires review:', requiresReview)

    // If challenge doesn't require review, auto-approve
    if (!requiresReview) {
      const { error: updateError } = await supabase
        .from('challenge_submissions')
        .update({
          admin_review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_review_notes: 'Auto-aprovado: desafio configurado para aprovação automática'
        })
        .eq('id', submissionId)

      if (updateError) {
        console.error('Error auto-approving submission:', updateError)
        throw new Error('Failed to auto-approve submission')
      }

      // Complete the challenge participation
      const { error: completeError } = await supabase
        .from('user_challenge_participations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', submission.participation_id)

      if (completeError) {
        console.error('Error completing participation:', completeError)
        throw new Error('Failed to complete challenge participation')
      }

      // Award challenge rewards (if any)
      try {
        const { error: rewardError } = await supabase.rpc('process_challenge_reward', {
          p_challenge_id: challenge.id,
          p_user_id: submission.user_id,
          p_company_id: challenge.company_id
        })
        
        if (rewardError) {
          console.error('Error processing rewards:', rewardError)
          // Don't throw error here as the submission is already approved
        }
      } catch (error) {
        console.error('Reward processing failed:', error)
        // Continue execution as submission is approved
      }

      // Create notification for user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: submission.user_id,
          company_id: challenge.company_id,
          type: 'challenge_completed',
          title: 'Desafio Concluído!',
          content: `Parabéns! Sua submissão para o desafio "${challenge.title}" foi aprovada automaticamente e o desafio foi concluído.`
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      console.log('Submission auto-approved and challenge completed')
    } else {
      console.log('Submission requires manual review, leaving as pending')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        autoApproved: !requiresReview,
        message: requiresReview ? 
          'Submissão enviada para análise dos administradores' : 
          'Submissão aprovada automaticamente'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error processing submission:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})