import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ResponseOption } from '@/hooks/useTrailStages';

interface CheckboxResponseProps {
  question: string;
  options: ResponseOption[];
  existingResponse?: any;
  onSubmit: (responseData: any) => void;
  isSubmitting: boolean;
}

export const CheckboxResponse = ({
  question,
  options,
  existingResponse,
  onSubmit,
  isSubmitting,
}: CheckboxResponseProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (existingResponse?.response_data?.selectedOptions) {
      setSelectedOptions(existingResponse.response_data.selectedOptions);
    }
  }, [existingResponse]);

  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionValue]);
    } else {
      setSelectedOptions(prev => prev.filter(val => val !== optionValue));
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;
    
    const selectedLabels = selectedOptions.map(value => 
      options.find(opt => opt.value === value)?.label
    ).filter(Boolean);

    onSubmit({
      responseData: {
        selectedOptions,
        selectedLabels
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua Resposta</CardTitle>
        {question && (
          <p className="text-muted-foreground">{question}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={selectedOptions.includes(option.value)}
                onCheckedChange={(checked) => 
                  handleOptionChange(option.value, checked as boolean)
                }
              />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Enviar Resposta'}
        </Button>
      </CardContent>
    </Card>
  );
};