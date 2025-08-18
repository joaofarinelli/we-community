import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { useSubdomain } from './useSubdomain';
import { toast } from '@/hooks/use-toast';

export const useCompanyFavicon = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { subdomain, customDomain } = useSubdomain();
  const preferredCompanyId = (typeof window !== 'undefined') ? localStorage.getItem('preferredCompanyId') : null;
  const companyQueryKey = ['company', subdomain, customDomain, user?.id, preferredCompanyId] as const;

  const uploadFavicon = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !company) throw new Error('Usuário ou empresa não encontrados');

      // Validate mime and size
      if (!(file.type === 'image/png' || file.type === 'image/jpeg')) {
        throw new Error('Envie um PNG ou JPG para o favicon.');
      }
      if (file.size > 512 * 1024) {
        throw new Error('O favicon deve ter no máximo 512KB.');
      }

      setUploading(true);

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${company.id}/favicon.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const { data, error: updateError } = await supabase
        .from('companies')
        .update({ favicon_url: publicUrl })
        .eq('id', company.id)
        .select();

      if (updateError) throw updateError;
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(companyQueryKey as any, data);
      // @ts-ignore
      queryClient.setQueriesData({ queryKey: ['company'] }, (old: any) => old ? { ...old, favicon_url: data.favicon_url } : old);
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({ title: 'Favicon atualizado', description: 'O favicon foi atualizado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar favicon', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    },
    onSettled: () => setUploading(false)
  });

  const removeFavicon = useMutation({
    mutationFn: async () => {
      if (!user || !company) throw new Error('Usuário ou empresa não encontrados');

      const { data, error } = await supabase
        .from('companies')
        .update({ favicon_url: null })
        .eq('id', company.id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(companyQueryKey as any, data);
      // @ts-ignore
      queryClient.setQueriesData({ queryKey: ['company'] }, (old: any) => old ? { ...old, favicon_url: null } : old);
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({ title: 'Favicon removido', description: 'O favicon foi removido com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover favicon', description: error?.message || 'Tente novamente.', variant: 'destructive' });
    }
  });

  return { uploadFavicon, removeFavicon, uploading };
};
