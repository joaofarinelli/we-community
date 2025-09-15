import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';

interface WhatsAppConfig {
  whatsapp_enabled: boolean;
  whatsapp_phone: string;
  whatsapp_message: string;
}

export const useWhatsAppConfig = () => {
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['whatsapp-config', company?.id],
    queryFn: async (): Promise<WhatsAppConfig | null> => {
      if (!company?.id) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('whatsapp_enabled, whatsapp_phone, whatsapp_message')
        .eq('id', company.id)
        .single();

      if (error) {
        console.error('Error fetching WhatsApp config:', error);
        return null;
      }

      return data;
    },
    enabled: !!company?.id,
  });
};