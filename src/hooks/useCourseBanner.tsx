import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export const useCourseBanner = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const { data: bannerUrl, isLoading } = useQuery({
    queryKey: ['course-banner', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('course_banner_url')
        .eq('id', company.id)
        .single();
      
      if (error) {
        console.error('Error fetching course banner:', error);
        return null;
      }
      
      return data?.course_banner_url || null;
    },
    enabled: !!company?.id,
  });

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !company?.id) {
        throw new Error('Usuário ou empresa não encontrados');
      }

      // Upload file to storage
      const fileName = `${company.id}-${Date.now()}.${file.name.split('.').pop()}`;
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

      // Update company with new banner URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ course_banner_url: urlData.publicUrl })
        .eq('id', company.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar empresa: ${updateError.message}`);
      }

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-banner'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Banner de cursos atualizado com sucesso!');
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

      // Remove banner URL from company
      const { error } = await supabase
        .from('companies')
        .update({ course_banner_url: null })
        .eq('id', company.id);

      if (error) {
        throw new Error(`Erro ao remover banner: ${error.message}`);
      }

      // Note: We don't delete the file from storage to avoid broken links
      // in case the same file is used elsewhere
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-banner'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Banner de cursos removido com sucesso!');
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