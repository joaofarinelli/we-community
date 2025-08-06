import { useMemo } from 'react';
import { useCompany } from '@/hooks/useCompany';

interface CompanyLogoProps {
  fallbackText?: string;
  className?: string;
  showName?: boolean;
  logoClassName?: string;
  textClassName?: string;
}

export const CompanyLogo = ({ 
  fallbackText = "Minha Comunidade", 
  className = "", 
  showName = false,
  logoClassName = "h-8 w-auto object-contain",
  textClassName = "text-lg font-bold font-heading"
}: CompanyLogoProps) => {
  const { data: company } = useCompany();

  if (company?.logo_url) {
    const logoSrc = useMemo(() => {
      // Cache-bust only when the URL changes to avoid extra reloads
      const suffix = company.logo_url.includes('?') ? '&' : '?';
      return `${company.logo_url}${suffix}v=${Date.now()}`;
    }, [company?.logo_url]);

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoSrc}
          alt={company.name || "Logo da empresa"}
          className={logoClassName}
        />
        {showName && company.name && (
          <span className={textClassName}>{company.name}</span>
        )}
      </div>
    );
  }

  return (
    <span className={`${textClassName} ${className}`}>
      {company?.name || fallbackText}
    </span>
  );
};