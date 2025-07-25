import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export const useCustomDomain = () => {
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  const updateCustomDomain = useMutation({
    mutationFn: async ({ domain }: { domain: string }) => {
      if (!company?.id) throw new Error('Company not found');

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        throw new Error('Formato de domínio inválido');
      }

      // Check if domain is already in use
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', company.id)
        .single();

      if (existingCompany) {
        throw new Error('Este domínio já está sendo usado por outra empresa');
      }

      const { error } = await supabase
        .from('companies')
        .update({
          custom_domain: domain,
          custom_domain_status: 'pending',
          custom_domain_verified_at: null
        })
        .eq('id', company.id);

      if (error) throw error;

      return { domain };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Domínio personalizado configurado! Verifique os registros DNS.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const removeCustomDomain = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Company not found');

      const { error } = await supabase
        .from('companies')
        .update({
          custom_domain: null,
          custom_domain_status: null,
          custom_domain_verified_at: null
        })
        .eq('id', company.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Domínio personalizado removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const verifyDomain = async () => {
    if (!company?.custom_domain) return;

    setIsVerifying(true);
    try {
      // In a real implementation, this would verify DNS records
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('companies')
        .update({
          custom_domain_status: 'verified',
          custom_domain_verified_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Domínio verificado com sucesso!');
    } catch (error) {
      toast.error('Falha na verificação do domínio');
    } finally {
      setIsVerifying(false);
    }
  };

  const getDnsRecords = () => {
    if (!company?.custom_domain) return [];

    return [
      {
        type: 'A',
        name: '@',
        value: '185.158.133.1',
        description: 'Registro A para o domínio raiz'
      },
      {
        type: 'CNAME',
        name: 'www',
        value: company.custom_domain,
        description: 'Registro CNAME para www'
      }
    ];
  };

  return {
    updateCustomDomain,
    removeCustomDomain,
    verifyDomain,
    getDnsRecords,
    isVerifying,
    customDomain: company?.custom_domain,
    customDomainStatus: company?.custom_domain_status,
    customDomainVerifiedAt: company?.custom_domain_verified_at
  };
};