import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ResponseOption } from '@/hooks/useTrailStages';

interface MultipleChoiceResponseProps {
  question: string;
  options: ResponseOption[];
  existingResponse?: any;
  onSubmit: (responseData: any) => void;
  isSubmitting: boolean;
}

export const MultipleChoiceResponse = ({
  question,
  options,
  existingResponse,
  onSubmit,
  isSubmitting,
}: MultipleChoiceResponseProps) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    if (existingResponse?.response_data?.selectedOption) {
      setSelectedOption(existingResponse.response_data.selectedOption);
    }
  }, [existingResponse]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    onSubmit({
      responseData: {
        selectedOption,
        selectedLabel: options.find(opt => opt.value === selectedOption)?.label
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
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Enviar Resposta'}
        </Button>
      </CardContent>
    </Card>
  );
};