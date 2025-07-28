import React from "react";
import { useForm } from "react-hook-form";
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
import { useSuperAdminCompanyActions, UpdateCompanyData } from "@/hooks/useSuperAdminCompanyActions";

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

  // Update form when company changes
  React.useEffect(() => {
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