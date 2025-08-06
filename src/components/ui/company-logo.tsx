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
  const logoSrc = useMemo(() => {
    const url = company?.logo_url;
    if (!url) return null;
    const suffix = url.includes('?') ? '&' : '?';
    return `${url}${suffix}v=${Date.now()}`;
  }, [company?.logo_url]);

  if (logoSrc) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoSrc}
          alt={company?.name || "Logo da empresa"}
          className={logoClassName}
        />
        {showName && company?.name && (
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