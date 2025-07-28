import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanyReport {
  company_id: string;
  company_name: string;
  users_active: number;
  users_total: number;
  spaces_total: number;
  posts_total: number;
  posts_this_month: number;
  lesson_completions: number;
  marketplace_purchases: number;
  total_coins_earned: number;
  user_engagement_score: number;
  last_activity: string;
}

export const useCompanyReport = (companyId: string) => {
  return useQuery<CompanyReport>({
    queryKey: ["company-report", companyId],
    queryFn: async () => {
      // Get basic company info
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Get user metrics
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, is_active')
        .eq('company_id', companyId);

      const usersTotal = profilesData?.length || 0;
      const usersActive = profilesData?.filter(p => p.is_active).length || 0;

      // Get spaces count
      const { count: spacesCount } = await supabase
        .from('spaces')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get posts metrics
      const { count: postsTotal } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const { count: postsThisMonth } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Get course progress
      const { count: lessonCompletions } = await supabase
        .from('user_course_progress')
        .select('*', { count: 'exact', head: true })
        .in('user_id', 
          profilesData?.map(p => p.user_id) || []
        );

      // Get marketplace purchases
      const { count: marketplacePurchases } = await supabase
        .from('marketplace_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get coins earned
      const { data: coinsData } = await supabase
        .from('point_transactions')
        .select('coins')
        .eq('company_id', companyId)
        .gt('coins', 0);

      const totalCoinsEarned = coinsData?.reduce((sum, t) => sum + t.coins, 0) || 0;

      // Get last activity
      const { data: lastActivity } = await supabase
        .from('posts')
        .select('created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate engagement score (simple formula)
      const engagementScore = usersTotal > 0 ? 
        Math.round(((postsThisMonth + (lessonCompletions || 0)) / usersTotal) * 10) : 0;

      return {
        company_id: companyId,
        company_name: company.name,
        users_active: usersActive,
        users_total: usersTotal,
        spaces_total: spacesCount || 0,
        posts_total: postsTotal || 0,
        posts_this_month: postsThisMonth || 0,
        lesson_completions: lessonCompletions || 0,
        marketplace_purchases: marketplacePurchases || 0,
        total_coins_earned: totalCoinsEarned,
        user_engagement_score: engagementScore,
        last_activity: lastActivity?.created_at || 'N/A'
      };
    },
    enabled: !!companyId,
    refetchInterval: 60000, // Refetch every minute
  });
};