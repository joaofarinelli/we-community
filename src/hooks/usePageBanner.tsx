import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export type BannerType = 
  | 'trails' 
  | 'members' 
  | 'ranking' 
  | 'marketplace' 
  | 'store' 
  | 'bank' 
  | 'challenges';

export const usePageBanner = (bannerType: BannerType) => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const columnName = `${bannerType}_banner_url` as const;

  const { data: bannerUrl, isLoading } = useQuery({
    queryKey: ['page-banner', bannerType, company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      return company[columnName];
    },
    enabled: !!company?.id,
  });

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !company?.id) {
        throw new Error('Usuário ou empresa não encontrados');
      }

      // Upload file to storage
      const fileName = `${bannerType}-${company.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('page-banners')
        .getPublicUrl(uploadData.path);

      // Update company with new banner URL
      const updateData = { [columnName]: urlData.publicUrl };
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar empresa: ${updateError.message}`);
      }

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-banner', bannerType] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success(`Banner de ${getBannerDisplayName(bannerType)} atualizado com sucesso!`);
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
      const updateData = { [columnName]: null };
      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);

      if (error) {
        throw new Error(`Erro ao remover banner: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-banner', bannerType] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success(`Banner de ${getBannerDisplayName(bannerType)} removido com sucesso!`);
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

function getBannerDisplayName(bannerType: BannerType): string {
  const names = {
    trails: 'Trilhas',
    members: 'Membros',
    ranking: 'Ranking',
    marketplace: 'Marketplace',
    store: 'Loja',
    bank: 'Banco',
    challenges: 'Desafios'
  };
  return names[bannerType];
}