import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export interface BannedWord {
  id: string;
  word: string;
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useBannedWords = () => {
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch banned words
  const {
    data: bannedWords,
    isLoading,
    error
  } = useQuery({
    queryKey: ['bannedWords', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('banned_words')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BannedWord[];
    },
    enabled: !!currentCompanyId,
  });

  // Add banned word
  const addBannedWord = useMutation({
    mutationFn: async ({ word, severity }: { word: string; severity: string }) => {
      if (!currentCompanyId) throw new Error('Company ID not found');

      const { data, error } = await supabase
        .from('banned_words')
        .insert({
          company_id: currentCompanyId,
          word: word.toLowerCase().trim(),
          severity,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannedWords', currentCompanyId] });
      toast({
        title: 'Palavra proibida adicionada',
        description: 'A palavra foi adicionada à lista de palavras proibidas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar palavra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update banned word
  const updateBannedWord = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BannedWord> }) => {
      const { data, error } = await supabase
        .from('banned_words')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannedWords', currentCompanyId] });
      toast({
        title: 'Palavra atualizada',
        description: 'A palavra proibida foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar palavra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete banned word
  const deleteBannedWord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banned_words')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannedWords', currentCompanyId] });
      toast({
        title: 'Palavra removida',
        description: 'A palavra foi removida da lista de palavras proibidas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover palavra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    bannedWords: bannedWords || [],
    isLoading,
    error,
    addBannedWord,
    updateBannedWord,
    deleteBannedWord,
  };
};