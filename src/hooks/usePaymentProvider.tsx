import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface PaymentProviderConfig {
  id: string;
  company_id: string;
  provider: string;
  environment: string;
  credentials: Record<string, any>;
  webhook_secret?: string;
  coins_per_brl: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  user_id: string;
  provider: string;
  purpose_type: 'coin_topup' | 'marketplace_item';
  reference_id?: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider_order_id?: string;
  boleto_url?: string;
  barcode?: string;
  linha_digitavel?: string;
  boleto_expiration?: string;
  payer_data: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const usePaymentProviderConfig = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['paymentProviderConfig', currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return null;

      const { data, error } = await supabase
        .from('payment_provider_configs')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('provider', 'tmb_educacao')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as PaymentProviderConfig | null;
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};

export const useCreateOrUpdatePaymentConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (configData: {
      environment: string;
      credentials: Record<string, any>;
      webhook_secret?: string;
      coins_per_brl: number;
    }) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or company not found');
      }

      const { data, error } = await supabase
        .from('payment_provider_configs')
        .upsert({
          company_id: currentCompanyId,
          provider: 'tmb_educacao',
          environment: configData.environment,
          credentials: configData.credentials,
          webhook_secret: configData.webhook_secret,
          coins_per_brl: configData.coins_per_brl,
          is_active: true,
          created_by: user.id
        }, {
          onConflict: 'company_id,provider'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Configuração de pagamento salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['paymentProviderConfig'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar configuração de pagamento');
    },
  });
};

export const useCreateBoleto = () => {
  return useMutation({
    mutationFn: async (paymentData: {
      companyId: string;
      purposeType: 'coin_topup' | 'marketplace_item';
      referenceId?: string;
      amountCents: number;
      payerData: {
        name: string;
        cpf: string;
        email?: string;
        address?: {
          street: string;
          number: string;
          neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
        };
      };
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('tmb-create-boleto', {
        body: paymentData
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao gerar boleto');
    },
  });
};

export const useCheckPaymentStatus = () => {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.functions.invoke('tmb-check-status', {
        body: { paymentId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
  });
};

export const useUserPayments = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userPayments', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};