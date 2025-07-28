import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSuperAdminCompanyActions, CreateCompanyData } from "@/hooks/useSuperAdminCompanyActions";

const basicInfoSchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  subdomain: z.string().optional(),
  custom_domain: z.string().optional(),
  plan: z.string().min(1, "Plano é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
});

const contactInfoSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  cnpj: z.string().optional(),
});

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCompanyDialog = ({ open, onOpenChange }: CreateCompanyDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { createCompany } = useSuperAdminCompanyActions();

  const basicForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      custom_domain: "",
      plan: "free",
      status: "active",
    },
  });

  const contactForm = useForm<z.infer<typeof contactInfoSchema>>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      cnpj: "",
    },
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await basicForm.trigger();
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const basicData = basicForm.getValues();
    const contactData = contactForm.getValues();
    
    const companyData: CreateCompanyData = {
      ...basicData,
      ...contactData,
    };

    createCompany.mutate(companyData, {
      onSuccess: () => {
        onOpenChange(false);
        setCurrentStep(1);
        basicForm.reset();
        contactForm.reset();
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
    basicForm.reset();
    contactForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between text-sm">
            <span className={currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
              Informações Básicas
            </span>
            <span className={currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
              Contato
            </span>
            <span className={currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
              Confirmação
            </span>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  {...basicForm.register("name")}
                  placeholder="Ex: Minha Empresa LTDA"
                />
                {basicForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{basicForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomínio</Label>
                  <Input
                    id="subdomain"
                    {...basicForm.register("subdomain")}
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
                    {...basicForm.register("custom_domain")}
                    placeholder="empresa.com.br"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <Select
                    value={basicForm.watch("plan")}
                    onValueChange={(value) => basicForm.setValue("plan", value)}
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
                    value={basicForm.watch("status")}
                    onValueChange={(value) => basicForm.setValue("status", value)}
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
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...contactForm.register("phone")}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    {...contactForm.register("cnpj")}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...contactForm.register("address")}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    {...contactForm.register("city")}
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    {...contactForm.register("state")}
                    placeholder="SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">CEP</Label>
                  <Input
                    id="postal_code"
                    {...contactForm.register("postal_code")}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Confirme os dados da empresa:</h3>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div>
                  <strong>Nome:</strong> {basicForm.watch("name")}
                </div>
                {basicForm.watch("subdomain") && (
                  <div>
                    <strong>Subdomínio:</strong> {basicForm.watch("subdomain")}.lovable.app
                  </div>
                )}
                {basicForm.watch("custom_domain") && (
                  <div>
                    <strong>Domínio:</strong> {basicForm.watch("custom_domain")}
                  </div>
                )}
                <div>
                  <strong>Plano:</strong> {basicForm.watch("plan")}
                </div>
                <div>
                  <strong>Status:</strong> {basicForm.watch("status") === 'active' ? 'Ativa' : 'Inativa'}
                </div>
                {contactForm.watch("phone") && (
                  <div>
                    <strong>Telefone:</strong> {contactForm.watch("phone")}
                  </div>
                )}
                {contactForm.watch("cnpj") && (
                  <div>
                    <strong>CNPJ:</strong> {contactForm.watch("cnpj")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="gap-2">
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createCompany.isPending}
                className="gap-2"
              >
                {createCompany.isPending ? "Criando..." : "Criar Empresa"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};