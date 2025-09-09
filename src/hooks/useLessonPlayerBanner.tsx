import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

interface LessonPlayerBannerConfig {
  imageUrl?: string;
  linkUrl?: string;
  openInNewTab?: boolean;
  [key: string]: any;
}

export const useLessonPlayerBanner = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const { data: bannerConfig, isLoading } = useQuery({
    queryKey: ['lesson-player-banner', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('theme_config')
        .eq('id', company.id)
        .single();
      
      if (error) {
        console.error('Error fetching lesson player banner config:', error);
        return null;
      }
      
      // Extract lesson player banner config from theme_config
      const themeConfig = data?.theme_config as Record<string, any> || {};
      return (themeConfig.lessonPlayerBanner as LessonPlayerBannerConfig) || null;
    },
    enabled: !!company?.id,
  });

  const updateBannerConfig = useMutation({
    mutationFn: async (config: LessonPlayerBannerConfig) => {
      if (!company?.id) {
        throw new Error('Empresa não encontrada');
      }

      // Get current theme_config
      const { data: currentData, error: fetchError } = await supabase
        .from('companies')
        .select('theme_config')
        .eq('id', company.id)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar configurações: ${fetchError.message}`);
      }

      const currentConfig = (currentData?.theme_config as Record<string, any>) || {};
      
      // Update lesson player banner config within theme_config
      const updatedConfig = {
        ...currentConfig,
        lessonPlayerBanner: config
      };

      const { error: updateError } = await supabase
        .from('companies')
        .update({ theme_config: updatedConfig })
        .eq('id', company.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar configurações: ${updateError.message}`);
      }

      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-player-banner'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Banner do player de aulas atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const uploadBannerImage = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !company?.id) {
        throw new Error('Usuário ou empresa não encontrados');
      }

      // Upload file to storage
      const fileName = `lesson-player-banner-${company.id}-${Date.now()}.${file.name.split('.').pop()}`;
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
      if (!company?.id) {
        throw new Error('Empresa não encontrada');
      }

      // Get current theme_config
      const { data: currentData, error: fetchError } = await supabase
        .from('companies')
        .select('theme_config')
        .eq('id', company.id)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar configurações: ${fetchError.message}`);
      }

      const currentConfig = (currentData?.theme_config as Record<string, any>) || {};
      
      // Remove lesson player banner config from theme_config
      const { lessonPlayerBanner, ...updatedConfig } = currentConfig;

      const { error: updateError } = await supabase
        .from('companies')
        .update({ theme_config: updatedConfig })
        .eq('id', company.id);

      if (updateError) {
        throw new Error(`Erro ao remover banner: ${updateError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-player-banner'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Banner do player de aulas removido com sucesso!');
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