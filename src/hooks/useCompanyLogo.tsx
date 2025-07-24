import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from '@/hooks/use-toast';

export const useCompanyLogo = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !company) throw new Error('Usuário ou empresa não encontrados');

      setUploading(true);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (company.logo_url) {
        const oldPath = company.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('company-logos')
            .remove([`${company.id}/${oldPath}`]);
        }
      }

      // Upload new logo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update company with new logo URL
      const { data, error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id)
        .select();

      if (updateError) throw updateError;

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: 'Logo atualizado',
        description: 'O logo da empresa foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Não foi possível fazer upload do logo. Tente novamente.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      if (!user || !company || !company.logo_url) {
        throw new Error('Usuário, empresa ou logo não encontrados');
      }

      // Remove from storage
      const oldPath = company.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('company-logos')
          .remove([`${company.id}/${oldPath}`]);
      }

      // Update company to remove logo URL
      const { data, error } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', company.id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: 'Logo removido',
        description: 'O logo da empresa foi removido com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error removing logo:', error);
      toast({
        title: 'Erro ao remover logo',
        description: 'Não foi possível remover o logo. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  return {
    uploadLogo,
    removeLogo,
    uploading
  };
};