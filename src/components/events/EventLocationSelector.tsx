import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface EventLocationSelectorProps {
  control: Control<any>;
  locationType: string;
}

export const EventLocationSelector = ({ control, locationType }: EventLocationSelectorProps) => {
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
        <FormField
          control={control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço do Local</FormLabel>
              <FormControl>
                <Input placeholder="Digite o endereço..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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