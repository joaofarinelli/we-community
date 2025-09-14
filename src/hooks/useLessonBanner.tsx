import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface LessonBannerConfig {
  banner_url?: string;
  banner_link_url?: string;
  banner_open_new_tab?: boolean;
}

export const useLessonBanner = (lessonId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bannerConfig, isLoading } = useQuery({
    queryKey: ['lesson-banner', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('banner_url, banner_link_url, banner_open_new_tab')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        console.error('Error fetching lesson banner:', error);
        return null;
      }
      
      return {
        banner_url: data.banner_url,
        banner_link_url: data.banner_link_url,
        banner_open_new_tab: data.banner_open_new_tab ?? true
      } as LessonBannerConfig;
    },
    enabled: !!lessonId,
  });

  // Real-time listener for lesson changes
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`lesson-banner-${lessonId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_lessons', filter: `id=eq.${lessonId}` },
        () => {
          console.log('🔔 Realtime: lesson banner updated, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['lesson-banner', lessonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, queryClient]);

  const updateBannerConfig = useMutation({
    mutationFn: async (config: LessonBannerConfig) => {
      if (!lessonId) {
        throw new Error('ID da aula não encontrado');
      }

      const { error } = await supabase
        .from('course_lessons')
        .update({
          banner_url: config.banner_url || null,
          banner_link_url: config.banner_link_url || null,
          banner_open_new_tab: config.banner_open_new_tab ?? true
        })
        .eq('id', lessonId);

      if (error) {
        throw new Error(`Erro ao atualizar banner: ${error.message}`);
      }

      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-banner', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      toast.success('Banner da aula atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const uploadBannerImage = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !lessonId) {
        throw new Error('Usuário ou aula não encontrados');
      }

      // Upload file to storage
      const fileName = `lesson-banner-${lessonId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-banners')
        .getPublicUrl(uploadData.path);

      return urlData.publicUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeBanner = useMutation({
    mutationFn: async () => {
      if (!lessonId) {
        throw new Error('ID da aula não encontrado');
      }

      const { error } = await supabase
        .from('course_lessons')
        .update({
          banner_url: null,
          banner_link_url: null,
          banner_open_new_tab: true
        })
        .eq('id', lessonId);

      if (error) {
        throw new Error(`Erro ao remover banner: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-banner', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      toast.success('Banner da aula removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    bannerConfig,
    isLoading,
    updateBannerConfig: updateBannerConfig.mutate,
    uploadBannerImage: uploadBannerImage.mutate,
    removeBanner: removeBanner.mutate,
    isUpdating: updateBannerConfig.isPending,
    isUploading: uploadBannerImage.isPending,
    isRemoving: removeBanner.isPending,
  };
};