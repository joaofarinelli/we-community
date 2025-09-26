import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting daily streak reset process...')

    // Call the database function to reset broken streaks
    const { data, error } = await supabase.rpc('reset_broken_streaks')

    if (error) {
      console.error('Error resetting streaks:', error)
      throw error
    }

    // Get broken streaks to send notifications
    const { data: brokenStreaks, error: fetchError } = await supabase
      .from('user_streaks')
      .select(`
        user_id,
        company_id,
        current_streak,
        profiles!user_streaks_user_id_fkey(first_name, last_name)
      `)
      .eq('is_active', false)
      .gt('current_streak', 0) // Users who just lost their streak

    if (fetchError) {
      console.error('Error fetching broken streaks:', fetchError)
    } else if (brokenStreaks?.length) {
      console.log(`Found ${brokenStreaks.length} broken streaks`)
      
      // Create notifications for users who lost their streak
      const notifications = brokenStreaks.map(streak => ({
        user_id: streak.user_id,
        company_id: streak.company_id,
        type: 'streak_lost',
        title: 'Ofensiva Perdida!',
        content: `Sua ofensiva de ${streak.current_streak} dias foi perdida. Entre hoje para começar uma nova!`
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
      } else {
        console.log(`Created ${notifications.length} notifications`)
      }
    }

    // Log completion
    console.log('Daily streak reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Streaks reset successfully',
        brokenStreaksCount: brokenStreaks?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in reset-streaks function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})