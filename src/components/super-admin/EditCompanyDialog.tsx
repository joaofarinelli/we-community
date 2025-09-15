import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { useSuperAdminCompanyActions, UpdateCompanyData } from "@/hooks/useSuperAdminCompanyActions";
import { usePaymentProviderConfig, useCreateOrUpdatePaymentConfig } from "@/hooks/usePaymentProvider";

const editCompanySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  subdomain: z.string().optional(),
  custom_domain: z.string().optional(),
  plan: z.string(),
  status: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  cnpj: z.string().optional(),
});

interface Company {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  status: string;
  plan: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  cnpj?: string;
}

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

export const EditCompanyDialog = ({ open, onOpenChange, company }: EditCompanyDialogProps) => {
  const { updateCompany } = useSuperAdminCompanyActions();
  const { data: paymentConfig } = usePaymentProviderConfig();
  const updatePaymentConfig = useCreateOrUpdatePaymentConfig();

  // Payment configuration states
  const [environment, setEnvironment] = useState('sandbox');
  const [apiKey, setApiKey] = useState('');
  const [coinsPerBrl, setCoinsPerBrl] = useState(1.0);
  const [isPaymentActive, setIsPaymentActive] = useState(false);
  const [boletoExpirationDays, setBoletoExpirationDays] = useState(7);

  const form = useForm<z.infer<typeof editCompanySchema>>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      name: "",
      subdomain: "",
      custom_domain: "",
      plan: "free",
      status: "active",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      cnpj: "",
    },
  });

  // Sync payment config states
  useEffect(() => {
    if (paymentConfig) {
      setEnvironment(paymentConfig.environment || 'sandbox');
      setApiKey(paymentConfig.credentials?.api_key || '');
      setCoinsPerBrl(paymentConfig.coins_per_brl || 1.0);
      setIsPaymentActive(paymentConfig.is_active || false);
      setBoletoExpirationDays(paymentConfig.boleto_expiration_days || 7);
    }
  }, [paymentConfig]);

  // Update form when company changes and set up realtime updates
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        subdomain: company.subdomain || "",
        custom_domain: company.custom_domain || "",
        plan: company.plan,
        status: company.status,
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        postal_code: company.postal_code || "",
        cnpj: company.cnpj || "",
      });

      // Set up realtime subscription for this company
      const channel = supabase
        .channel(`company-${company.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'companies',
            filter: `id=eq.${company.id}`
          },
          (payload) => {
            console.log('Company updated in real-time:', payload.new);
            // Update form with new data
            if (payload.new) {
              form.reset({
                name: payload.new.name || "",
                subdomain: payload.new.subdomain || "",
                custom_domain: payload.new.custom_domain || "",
                plan: payload.new.plan || "free",
                status: payload.new.status || "active",
                phone: payload.new.phone || "",
                address: payload.new.address || "",
                city: payload.new.city || "",
                state: payload.new.state || "",
                postal_code: payload.new.postal_code || "",
                cnpj: payload.new.cnpj || "",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [company, form]);

  const onSubmit = (data: z.infer<typeof editCompanySchema>) => {
    if (!company) return;

    const updateData: UpdateCompanyData = {
      id: company.id,
      ...data,
    };

    updateCompany.mutate(updateData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleSavePaymentConfig = async () => {
    try {
      await updatePaymentConfig.mutateAsync({
        environment,
        credentials: {
          api_key: apiKey,
        },
        coins_per_brl: Number(coinsPerBrl),
        boleto_expiration_days: Number(boletoExpirationDays),
        is_active: isPaymentActive,
      });
      toast.success('Configurações de pagamento salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações de pagamento');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">INFORMAÇÕES BÁSICAS</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Minha Empresa LTDA"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomínio</Label>
                <Input
                  id="subdomain"
                  {...form.register("subdomain")}
                  placeholder="minhaempresa"
                />
                <p className="text-xs text-muted-foreground">
                  Será: minhaempresa.lovable.app
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_domain">Domínio Personalizado</Label>
                <Input
                  id="custom_domain"
                  {...form.register("custom_domain")}
                  placeholder="empresa.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={form.watch("plan")}
                  onValueChange={(value) => form.setValue("plan", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">INFORMAÇÕES DE CONTATO</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  {...form.register("cnpj")}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                {...form.register("address")}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...form.register("city")}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...form.register("state")}
                  placeholder="SP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  {...form.register("postal_code")}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-medium text-muted-foreground">CONFIGURAÇÕES DE PAGAMENTO</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-environment">Ambiente</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coins-per-brl">Moedas por R$ 1,00</Label>
                <Input
                  id="coins-per-brl"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={coinsPerBrl}
                  onChange={(e) => setCoinsPerBrl(Number(e.target.value))}
                  placeholder="1.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key TMB</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Chave de API do TMB Educação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boleto-expiration">Dias para vencimento</Label>
                <Input
                  id="boleto-expiration"
                  type="number"
                  min="1"
                  max="30"
                  value={boletoExpirationDays}
                  onChange={(e) => setBoletoExpirationDays(Number(e.target.value))}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="payment-active"
                  checked={isPaymentActive}
                  onCheckedChange={setIsPaymentActive}
                  disabled={!apiKey.trim()}
                />
                <Label htmlFor="payment-active">Habilitar pagamentos via boleto</Label>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSavePaymentConfig}
                disabled={!apiKey.trim() || updatePaymentConfig.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updatePaymentConfig.isPending ? 'Salvando...' : 'Salvar Pagamentos'}
              </Button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateCompany.isPending}
            >
              {updateCompany.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};