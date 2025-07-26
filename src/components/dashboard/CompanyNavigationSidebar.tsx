import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useCrossDomainAuth } from '@/hooks/useCrossDomainAuth';
import { useCompany } from '@/hooks/useCompany';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export const CompanyNavigationSidebar = () => {
  const { userCompanies, currentCompanyId } = useCompanyContext();
  const { availableAccounts, switchToAccount } = useCrossDomainAuth();
  const { data: currentCompany } = useCompany();

  // Use cross-domain accounts if available, otherwise fall back to user companies
  const companies = availableAccounts.length > 0 ? availableAccounts : userCompanies;

  // Only show if user has multiple companies
  if (companies.length <= 1) {
    return null;
  }

  const handleCompanySwitch = (company: any) => {
    if (availableAccounts.length > 0 && company.user_id) {
      // Use cross-domain authentication
      switchToAccount(company.user_id, company.company_id);
    } else {
      // Use regular company switching
      // switchToCompany(company.company_id);
      window.location.href = `${window.location.protocol}//${company.company_subdomain ? `${company.company_subdomain}.${window.location.hostname.split('.').slice(-2).join('.')}` : window.location.hostname}`;
    }
  };
  return (
    <TooltipProvider>
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 space-y-3">
        {/* Current Company Indicator */}
        <div className="flex flex-col items-center space-y-1 pb-2 border-b border-border/50 w-full">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-[10px] px-1">
            {companies.length}
          </Badge>
        </div>

        {/* Company List */}
        <div className="space-y-3 flex-1">
          {companies.map((company) => (
            <Tooltip key={company.company_id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-12 w-12 p-0 rounded-lg transition-all duration-200 ${
                    company.company_id === currentCompanyId
                      ? 'bg-primary/10 border-2 border-primary/20 shadow-sm'
                      : 'hover:bg-accent border-2 border-transparent'
                  }`}
                  onClick={() => handleCompanySwitch(company)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={company.company_logo_url} 
                      alt={company.company_name}
                    />
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {company.company_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <div className="text-center">
                  <p className="font-medium">{company.company_name}</p>
                  <p className="text-xs text-muted-foreground">{company.user_role}</p>
                  {company.company_id === currentCompanyId && (
                    <Badge variant="default" className="text-xs mt-1">
                      Atual
                    </Badge>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};