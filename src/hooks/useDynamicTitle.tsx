import { useEffect } from 'react';
import { useCompany } from './useCompany';

export const useDynamicTitle = () => {
  const { data: company } = useCompany();

  useEffect(() => {
    if (company?.name) {
      document.title = company.name;
    } else {
      document.title = 'spark-guild-hub';
    }
  }, [company?.name]);
};