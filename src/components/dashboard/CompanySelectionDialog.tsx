import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, ExternalLink } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface CompanySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onCompanySelect: (companyId: string) => void;
}

export const CompanySelectionDialog = ({ open, onClose, onCompanySelect }: CompanySelectionDialogProps) => {
  const { userCompanies } = useCompanyContext();

  const handleSelectCompany = (companyId: string) => {
    onCompanySelect(companyId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecionar Empresa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Você tem acesso a múltiplas empresas. Selecione qual empresa deseja acessar:
          </p>
          
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {userCompanies.map((company) => (
              <Card 
                key={company.company_id}
                className="cursor-pointer transition-all hover:bg-accent hover:scale-[1.02]"
                onClick={() => handleSelectCompany(company.company_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={company.company_logo_url || undefined} 
                          alt={company.company_name}
                        />
                        <AvatarFallback className="text-lg font-semibold bg-primary/20 text-primary">
                          {company.company_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-base">{company.company_name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {company.user_role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      Acessar
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                {(company.company_subdomain || company.company_custom_domain) && (
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs flex items-center gap-1">
                      🌐 {company.company_custom_domain || `${company.company_subdomain}.dominio.com`}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};