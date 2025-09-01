import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateSegment } from '@/hooks/useCreateSegment';

interface CreateSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEGMENT_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1'
];

export const CreateSegmentDialog = ({ open, onOpenChange }: CreateSegmentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(SEGMENT_COLORS[0]);
  
  const { mutate: createSegment, isPending } = useCreateSegment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    createSegment(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setSelectedColor(SEGMENT_COLORS[0]);
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Segmento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do segmento *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Novos membros"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste segmento..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cor do segmento</Label>
            <div className="flex flex-wrap gap-2">
              {SEGMENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Criando...' : 'Criar Segmento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};