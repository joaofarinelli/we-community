import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useChallengeParticipations = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['challenge-participations', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('user_challenge_participations')
        .select(`
          *,
          challenges!inner(
            id,
            title,
            description,
            challenge_type,
            reward_type,
            reward_value,
            image_url,
            requirements
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};

export const useAcceptChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({ challengeId, durationDays }: { challengeId: string; durationDays?: number }) => {
      if (!user?.id || !company?.id) throw new Error('User not authenticated or company not found');

      // Fetch challenge to determine deadline behavior
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('id, end_date, challenge_duration_days, challenge_duration_hours, deadline_type, is_active')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;
      if (!challenge?.is_active) throw new Error('Desafio inativo');

      const now = new Date();
      let expiresAt: Date | null = null;

      if (challenge.deadline_type === 'fixed_date' && challenge.end_date) {
        const end = new Date(challenge.end_date as string);
        if (end <= now) throw new Error('Data limite já passou');
        expiresAt = end;
      } else {
        const days = (challenge.challenge_duration_days ?? durationDays ?? 0) as number;
        const hours = (challenge.challenge_duration_hours ?? 0) as number;
        if ((days || 0) === 0 && (hours || 0) === 0) {
          throw new Error('Prazo inválido para o desafio');
        }
        const exp = new Date(now);
        if (days) exp.setDate(exp.getDate() + days);
        if (hours) exp.setHours(exp.getHours() + hours);
        expiresAt = exp;
      }

      const { data, error } = await supabase
        .from('user_challenge_participations')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          company_id: company.id,
          expires_at: (expiresAt as Date).toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-participations'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Desafio aceito com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao aceitar desafio: ' + error.message);
    }
  });
};

export const useUpdateParticipationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participationId, status }: { participationId: string; status: string }) => {
      const { data, error } = await supabase
        .from('user_challenge_participations')
        .update({ status })
        .eq('id', participationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-participations'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });
};

export const useChallengeParticipationsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-challenge-participations'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_challenge_participations')
        .select(`
          *,
          challenges!inner(
            id,
            title,
            challenge_type
          ),
          profiles!inner(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};