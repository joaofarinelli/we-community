import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useHidePost } from '@/hooks/useHidePost';

interface HidePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
}

export const HidePostDialog = ({
  open,
  onOpenChange,
  postId,
  postTitle,
}: HidePostDialogProps) => {
  const [reason, setReason] = useState('');
  const hidePost = useHidePost();

  const handleConfirm = async () => {
    try {
      await hidePost.mutateAsync({ postId, reason: reason.trim() || undefined });
      onOpenChange(false);
      setReason('');
    } catch (error) {
      console.error('Error hiding post:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ocultar Post</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja ocultar {postTitle ? `"${postTitle}"` : 'este post'}?
            O post não será mais visível para outros usuários.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo para ocultar este post..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={hidePost.isPending}
          >
            {hidePost.isPending ? 'Ocultando...' : 'Ocultar Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};