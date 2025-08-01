import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export const useChallengeSubmissions = (participationId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenge-submissions', participationId, user?.id],
    queryFn: async () => {
      if (!user?.id || !participationId) return [];

      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('participation_id', participationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!participationId,
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async (submissionData: {
      participationId: string;
      submissionType: 'text' | 'image' | 'file';
      submissionContent?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      if (!user?.id || !company?.id) throw new Error('User not authenticated or company not found');

      const { data, error } = await supabase
        .from('challenge_submissions')
        .insert({
          participation_id: submissionData.participationId,
          user_id: user.id,
          company_id: company.id,
          submission_type: submissionData.submissionType,
          submission_content: submissionData.submissionContent,
          file_url: submissionData.fileUrl,
          file_name: submissionData.fileName,
          file_size: submissionData.fileSize,
          mime_type: submissionData.mimeType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-submissions'] });
      toast.success('Prova enviada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar prova: ' + error.message);
    }
  });
};

export const useAdminSubmissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-challenge-submissions'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('challenge_submissions')
        .select(`
          *,
          user_challenge_participations!inner(
            id,
            user_id,
            challenges!inner(
              title
            ),
            profiles!inner(
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useReviewSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      status, 
      notes 
    }: { 
      submissionId: string; 
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('challenge_submissions')
        .update({
          admin_review_status: status,
          admin_review_notes: notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenge-submissions'] });
      toast.success('Revisão salva com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao revisar submissão: ' + error.message);
    }
  });
};