import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

interface UseCepLookupReturn {
  lookupCep: (cep: string) => Promise<CepData | null>;
  isLoading: boolean;
}

export const useCepLookup = (): UseCepLookupReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const formatCep = (cep: string): string => {
    return cep.replace(/\D/g, '');
  };

  const isValidCep = (cep: string): boolean => {
    const cleanCep = formatCep(cep);
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  };

  const lookupCep = async (cep: string): Promise<CepData | null> => {
    const cleanCep = formatCep(cep);
    
    if (!isValidCep(cleanCep)) {
      toast({
        variant: "destructive",
        title: "CEP inválido",
        description: "Por favor, digite um CEP válido com 8 dígitos.",
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      
      const data: CepData = await response.json();
      
      if (data.cep && !data.hasOwnProperty('erro')) {
        return data;
      } else {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado.",
        });
        return null;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: "Não foi possível consultar o CEP. Tente novamente.",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    lookupCep,
    isLoading,
  };
};