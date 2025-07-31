import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ScaleResponseProps {
  question: string;
  existingResponse?: any;
  onSubmit: (responseData: any) => void;
  isSubmitting: boolean;
}

export const ScaleResponse = ({
  question,
  existingResponse,
  onSubmit,
  isSubmitting,
}: ScaleResponseProps) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  useEffect(() => {
    if (existingResponse?.response_data?.selectedValue !== undefined) {
      setSelectedValue(existingResponse.response_data.selectedValue);
    }
  }, [existingResponse]);

  const handleSubmit = () => {
    if (selectedValue === null) return;
    
    onSubmit({
      responseData: {
        selectedValue,
        scaleType: '0-10'
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua Avaliação</CardTitle>
        {question && (
          <p className="text-muted-foreground">{question}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium">Selecione uma nota de 0 a 10:</p>
          <div className="grid grid-cols-11 gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedValue(i)}
                className={`h-12 w-12 rounded-lg border-2 font-semibold transition-all hover:scale-105 ${
                  selectedValue === i
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-muted hover:border-primary'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Muito baixo</span>
            <span>Muito alto</span>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={selectedValue === null || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Enviar Avaliação'}
        </Button>
      </CardContent>
    </Card>
  );
};