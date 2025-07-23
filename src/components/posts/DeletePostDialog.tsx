import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeletePost } from '@/hooks/useDeletePost';

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
}

export const DeletePostDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  postTitle 
}: DeletePostDialogProps) => {
  const { mutate: deletePost, isPending } = useDeletePost();

  const handleDelete = () => {
    deletePost(postId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar post</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar {postTitle ? `"${postTitle}"` : 'este post'}? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deletando...' : 'Deletar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};