import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { AddressFields } from '@/components/ui/address-fields';
import { Control, UseFormSetValue } from 'react-hook-form';

interface EventLocationSelectorProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  locationType: string;
}

export const EventLocationSelector = ({ control, setValue, locationType }: EventLocationSelectorProps) => {
  return (
    <>
      <FormField
        control={control}
        name="locationType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Tipo de Local</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="presencial" id="presencial" />
                  <label htmlFor="presencial" className="text-sm font-medium">Presencial</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <label htmlFor="online" className="text-sm font-medium">Online (Meet, Zoom, etc.)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indefinido" id="indefinido" />
                  <label htmlFor="indefinido" className="text-sm font-medium">Indefinido</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {locationType === 'presencial' && (
        <>
          <AddressFields 
            control={control}
            setValue={setValue}
            required={true}
            showFullAddress={true}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto 101, Bloco A..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {locationType === 'online' && (
        <FormField
          control={control}
          name="onlineLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Reunião</FormLabel>
              <FormControl>
                <Input placeholder="https://meet.google.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};