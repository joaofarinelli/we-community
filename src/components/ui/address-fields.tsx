import { useEffect } from 'react';
import { Control, useWatch, UseFormSetValue } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCepLookup } from '@/hooks/useCepLookup';
import { Loader2 } from 'lucide-react';

interface AddressFieldsProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  baseName?: string;
  required?: boolean;
  showFullAddress?: boolean;
}

export const AddressFields = ({ 
  control, 
  setValue,
  baseName = '', 
  required = false,
  showFullAddress = true 
}: AddressFieldsProps) => {
  const { lookupCep, isLoading } = useCepLookup();
  
  const getFieldName = (field: string) => baseName ? `${baseName}.${field}` : field;
  
  // Watch the postal code field
  const postalCode = useWatch({
    control,
    name: getFieldName('postalCode'),
  });

  useEffect(() => {
    const handleCepLookup = async () => {
      if (postalCode && postalCode.length >= 8) {
        const cleanCep = postalCode.replace(/\D/g, '');
        if (cleanCep.length === 8) {
          const cepData = await lookupCep(cleanCep);
          if (cepData && setValue) {
            setValue(getFieldName('address'), cepData.logradouro || '');
            setValue(getFieldName('neighborhood'), cepData.bairro || '');
            setValue(getFieldName('city'), cepData.localidade || '');
            setValue(getFieldName('state'), cepData.uf || '');
          }
        }
      }
    };

    handleCepLookup();
  }, [postalCode, lookupCep, setValue, getFieldName]);

  return (
    <>
      <FormField
        control={control}
        name={getFieldName('postalCode')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>CEP {required && '*'}</FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  placeholder="00000-000" 
                  {...field}
                  maxLength={9}
                  onChange={(e) => {
                    // Format CEP as user types
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 5) {
                      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                    }
                    field.onChange(value);
                  }}
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showFullAddress && (
        <>
          <FormField
            control={control}
            name={getFieldName('address')}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço {required && '*'}</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, avenida..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={getFieldName('neighborhood')}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro {required && '*'}</FormLabel>
                <FormControl>
                  <Input placeholder="Bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={getFieldName('city')}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade {required && '*'}</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={getFieldName('state')}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado {required && '*'}</FormLabel>
                <FormControl>
                  <Input placeholder="UF" {...field} maxLength={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
};