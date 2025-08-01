import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export const useChallengeParticipations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenge-participations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useAcceptChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useMutation({
    mutationFn: async ({ challengeId, durationDays }: { challengeId: string; durationDays: number }) => {
      if (!user?.id || !company?.id) throw new Error('User not authenticated or company not found');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { data, error } = await supabase
        .from('user_challenge_participations')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          company_id: company.id,
          expires_at: expiresAt.toISOString()
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