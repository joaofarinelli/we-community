import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const useSpaceBanner = (spaceId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bannerUrl, isLoading } = useQuery({
    queryKey: ['space-banner', spaceId],
    queryFn: async () => {
      if (!spaceId) return null;
      
      const { data, error } = await supabase
        .from('spaces')
        .select('banner_url')
        .eq('id', spaceId)
        .single();

      if (error) throw error;
      return data?.banner_url;
    },
    enabled: !!spaceId,
  });

  // Real-time listener for space changes
  useEffect(() => {
    if (!spaceId) return;

    const channel = supabase
      .channel(`space-banner-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces', filter: `id=eq.${spaceId}` },
        () => {
          console.log('🔔 Realtime: space banner updated, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['space-banner', spaceId] });
          queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId, queryClient]);

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !spaceId) {
        throw new Error('Usuário ou espaço não encontrados');
      }

      // Upload file to storage
      const fileName = `space-${spaceId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('space-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('space-banners')
        .getPublicUrl(uploadData.path);

      // Update space with new banner URL
      const { error: updateError } = await supabase
        .from('spaces')
        .update({ banner_url: urlData.publicUrl })
        .eq('id', spaceId);

      if (updateError) {
        throw new Error(`Erro ao atualizar espaço: ${updateError.message}`);
      }

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-banner', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      toast.success('Banner do espaço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeBanner = useMutation({
    mutationFn: async () => {
      if (!spaceId) {
        throw new Error('Espaço não encontrado');
      }

      // Remove banner URL from space
      const { error } = await supabase
        .from('spaces')
        .update({ banner_url: null })
        .eq('id', spaceId);

      if (error) {
        throw new Error(`Erro ao remover banner: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-banner', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      toast.success('Banner do espaço removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    bannerUrl,
    isLoading,
    uploadBanner: uploadBanner.mutate,
    removeBanner: removeBanner.mutate,
    isUploading: uploadBanner.isPending,
    isRemoving: removeBanner.isPending,
  };
};