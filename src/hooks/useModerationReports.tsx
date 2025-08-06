import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export interface ModerationReport {
  id: string;
  company_id: string;
  post_id?: string;
  comment_id?: string;
  content_type: 'post' | 'comment';
  original_content: string;
  flagged_words: string[];
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useModerationReports = () => {
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch moderation reports
  const {
    data: reports,
    isLoading,
    error
  } = useQuery({
    queryKey: ['moderationReports', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('moderation_reports')
        .select(`
          *,
          posts (
            id,
            title,
            author_id,
            profiles (first_name, last_name)
          ),
          post_interactions (
            id,
            content,
            user_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ModerationReport[];
    },
    enabled: !!currentCompanyId,
  });

  // Review report (approve/reject)
  const reviewReport = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      notes 
    }: { 
      reportId: string; 
      status: 'approved' | 'rejected'; 
      notes?: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('moderation_reports')
        .update({
          status,
          reviewed_by: user.data.user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // If approved, remove restriction from the content
      if (status === 'approved') {
        const report = data as ModerationReport;
        const table = report.content_type === 'post' ? 'posts' : 'post_interactions';
        const targetId = report.content_type === 'post' ? report.post_id : report.comment_id;

        if (targetId) {
          const { error: updateError } = await supabase
            .from(table)
            .update({
              is_restricted: false,
              auto_flagged: false,
              flagged_reason: null,
              flagged_at: null
            })
            .eq('id', targetId);

          if (updateError) {
            console.error('Error removing restriction:', updateError);
          }
        }
      }

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['moderationReports', currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
      
      toast({
        title: status === 'approved' ? 'Conteúdo aprovado' : 'Conteúdo rejeitado',
        description: status === 'approved' 
          ? 'O conteúdo foi aprovado e já está visível para todos os usuários.'
          : 'O conteúdo foi rejeitado e permanecerá restrito.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na moderação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get pending reports count
  const pendingCount = reports?.filter(report => report.status === 'pending').length || 0;

  return {
    reports: reports || [],
    isLoading,
    error,
    reviewReport,
    pendingCount,
  };
};