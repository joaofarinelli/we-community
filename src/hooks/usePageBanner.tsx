import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, setGlobalCompanyId } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';
import { useEffect } from 'react';

export type BannerType = 
  | 'trails' 
  | 'members' 
  | 'ranking' 
  | 'marketplace' 
  | 'store' 
  | 'bank' 
  | 'challenges'
  | 'spaces'
  | 'courses'
  | 'feed'
  | 'login';

export const usePageBanner = (bannerType: BannerType) => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const columnName = `${bannerType}_banner_url` as const;

  const { data: bannerUrl, isLoading } = useQuery({
    queryKey: ['page-banner', bannerType, company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      
      // Directly query companies table to ensure we get the latest banner URL
      const { data: companyData } = await supabase
        .from('companies')
        .select(columnName)
        .eq('id', company.id)
        .single();
      
      console.log(`🎯 Direct banner query for ${bannerType}:`, companyData?.[columnName]);
      return companyData?.[columnName] || null;
    },
    enabled: !!company?.id,
  });

  // Setup real-time updates for banner changes
  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel(`banner-changes-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${company.id}`,
        },
        (payload) => {
          console.log('🔄 Real-time banner update received:', payload);
          // Invalidate queries when banner changes
          queryClient.invalidateQueries({ queryKey: ['page-banner'] });
          queryClient.invalidateQueries({ 
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'company'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, queryClient]);

  const uploadBanner = useMutation({
    mutationFn: async (file: File) => {
      console.log('🖼️ Starting banner upload for:', bannerType, 'company:', company?.id);
      
      if (!user?.id || !company?.id) {
        throw new Error('Usuário ou empresa não encontrados');
      }

      // Force set company context to ensure header is included
      setGlobalCompanyId(company.id);
      console.log('🌐 Set global company ID for banner upload:', company.id);

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

      console.log('📤 Uploading banner, URL:', urlData.publicUrl);

      // Update company with new banner URL - use .select() to verify update
      const updateData = { [columnName]: urlData.publicUrl };
      const { data: updateResult, error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select(`id, ${columnName}`)
        .single();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw new Error(`Erro ao atualizar empresa: ${updateError.message}`);
      }

      if (!updateResult) {
        console.error('❌ No data returned from update - RLS may have blocked it');
        throw new Error('Erro ao salvar banner - verificação de permissão falhou');
      }

      console.log('✅ Banner update successful:', updateResult);
      return urlData.publicUrl;
    },
    onSuccess: (newBannerUrl) => {
      console.log('🎉 Banner upload success, updating cache with:', newBannerUrl);
      
      // Optimistically update company cache
      queryClient.setQueriesData(
        { predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'company' },
        (oldData: any) => {
          if (oldData) {
            console.log('📝 Updating company cache with new banner URL:', columnName, newBannerUrl);
            return { ...oldData, [columnName]: newBannerUrl };
          }
          return oldData;
        }
      );

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['page-banner', bannerType] });
      queryClient.invalidateQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'company'
      });
      
      toast.success(`Banner de ${getBannerDisplayName(bannerType)} atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeBanner = useMutation({
    mutationFn: async () => {
      console.log('🗑️ Starting banner removal for:', bannerType, 'company:', company?.id);
      
      if (!company?.id) {
        throw new Error('Empresa não encontrada');
      }

      // Force set company context to ensure header is included
      setGlobalCompanyId(company.id);

      // Remove banner URL from company - use .select() to verify update
      const updateData = { [columnName]: null };
      const { data: updateResult, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id)
        .select(`id, ${columnName}`)
        .single();

      if (error) {
        console.error('❌ Remove error:', error);
        throw new Error(`Erro ao remover banner: ${error.message}`);
      }

      if (!updateResult) {
        console.error('❌ No data returned from remove - RLS may have blocked it');
        throw new Error('Erro ao remover banner - verificação de permissão falhou');
      }

      console.log('✅ Banner removal successful:', updateResult);
    },
    onSuccess: () => {
      console.log('🎉 Banner removal success, updating cache');
      
      // Optimistically update company cache
      queryClient.setQueriesData(
        { predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'company' },
        (oldData: any) => {
          if (oldData) {
            console.log('📝 Updating company cache to remove banner URL:', columnName);
            return { ...oldData, [columnName]: null };
          }
          return oldData;
        }
      );

      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['page-banner', bannerType] });
      queryClient.invalidateQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'company'
      });
      
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
    challenges: 'Desafios',
    spaces: 'Espaços',
    courses: 'Cursos',
    feed: 'Feed',
    login: 'Login'
  };
  return names[bannerType];
}