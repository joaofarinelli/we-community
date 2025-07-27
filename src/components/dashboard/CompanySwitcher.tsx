import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Building2, Plus } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useCompany } from '@/hooks/useCompany';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export const CompanySwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userCompanies, switchToCompany, currentCompanyId } = useCompanyContext();
  const { data: currentCompany } = useCompany();

  const handleSwitchCompany = async (companyId: string) => {
    await switchToCompany(companyId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto justify-between min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {currentCompany?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {currentCompany?.name || 'Selecionar Empresa'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Trocar de Empresa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {userCompanies.length > 0 ? (
            userCompanies.map((company) => (
              <Card 
                key={company.company_id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  company.company_id === currentCompanyId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSwitchCompany(company.company_id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{company.company_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {company.user_role}
                        </Badge>
                        {company.company_id === currentCompanyId && (
                          <Badge variant="default" className="text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {company.company_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                {(company.company_subdomain || company.company_custom_domain) && (
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      {company.company_custom_domain || `${company.company_subdomain}.dominio.com`}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma empresa encontrada</p>
            </div>
          )}
          
          <Separator />
          
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Plus className="h-4 w-4" />
            Criar Nova Empresa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};