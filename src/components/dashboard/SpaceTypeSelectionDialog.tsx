import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { spaceTypes, type SpaceType } from '@/lib/spaceUtils';
import { spaceTypeSelectionSchema, type SpaceTypeSelectionFormData } from '@/lib/schemas';
import { cn } from '@/lib/utils';

interface SpaceTypeSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: SpaceType) => void;
}

export const SpaceTypeSelectionDialog = ({
  open,
  onClose,
  onSelectType,
}: SpaceTypeSelectionDialogProps) => {
  const [selectedType, setSelectedType] = useState<SpaceType | null>(null);

  const { handleSubmit } = useForm<SpaceTypeSelectionFormData>({
    resolver: zodResolver(spaceTypeSelectionSchema),
  });

  const onSubmit = () => {
    if (selectedType) {
      onSelectType(selectedType);
    }
  };

  const handleTypeSelect = (type: SpaceType) => {
    setSelectedType(type);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Escolha o tipo de espaço
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {spaceTypes.map((spaceType) => {
              const Icon = spaceType.icon;
              const isSelected = selectedType === spaceType.type;
              
              return (
                <div
                  key={spaceType.type}
                  onClick={() => handleTypeSelect(spaceType.type)}
                  className={cn(
                    "p-6 rounded-lg border-2 cursor-pointer transition-all duration-200",
                    "hover:border-primary hover:shadow-medium",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-medium"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                      "p-3 rounded-full transition-colors",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {spaceType.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {spaceType.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedType}
              className="px-8"
            >
              Próximo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};