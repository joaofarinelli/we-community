import { useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyRealtime } from '@/hooks/useCompanyRealtime';

export const FaviconApplier = () => {
  const { data: company } = useCompany();
  useCompanyRealtime();

  useEffect(() => {
    const applyFavicon = (href: string) => {
      const version = Date.now();
      const finalHref = href ? `${href}${href.includes('?') ? '&' : '?'}v=${version}` : '/favicon.ico';

      const setLink = (rel: string) => {
        let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', rel);
          document.head.appendChild(link);
        }
        link.setAttribute('href', finalHref);
        link.setAttribute('type', 'image/png');
      };

      setLink('icon');
      setLink('shortcut icon');
    };

    applyFavicon(company?.favicon_url || '/favicon.ico');
  }, [company?.favicon_url]);

  return null;
};
