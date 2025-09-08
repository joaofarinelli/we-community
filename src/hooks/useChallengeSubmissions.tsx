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

      // Fetch submissions with basic data
      const { data: submissions, error: submissionsError } = await supabase
        .from('challenge_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!submissions || submissions.length === 0) return [];

      // Get unique participation IDs and user IDs
      const participationIds = [...new Set(submissions.map(s => s.participation_id))];
      const userIds = [...new Set(submissions.map(s => s.user_id))];

      // Fetch participation data
      const { data: participations, error: participationsError } = await supabase
        .from('user_challenge_participations')
        .select('id, challenge_id')
        .in('id', participationIds);

      if (participationsError) throw participationsError;

      // Get unique challenge IDs
      const challengeIds = [...new Set(participations?.map(p => p.challenge_id) || [])];

      // Fetch challenge data
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('id, title')
        .in('id', challengeIds);

      if (challengesError) throw challengesError;

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const enrichedSubmissions = submissions.map(submission => {
        const participation = participations?.find(p => p.id === submission.participation_id);
        const challenge = challenges?.find(c => c.id === participation?.challenge_id);
        const profile = profiles?.find(p => p.user_id === submission.user_id);
        
        return {
          ...submission,
          challenge_title: challenge?.title || 'Desafio não encontrado',
          user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Usuário não encontrado',
          user_email: profile?.email || ''
        };
      });

      return enrichedSubmissions;
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