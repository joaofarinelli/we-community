import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteSpace } from '@/hooks/useDeleteSpace';
import { toast } from 'sonner';

interface DeleteSpaceDialogProps {
  space: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteSpaceDialog = ({ space, isOpen, onOpenChange }: DeleteSpaceDialogProps) => {
  const deleteSpaceMutation = useDeleteSpace();

  const handleDelete = async () => {
    try {
      await deleteSpaceMutation.mutateAsync(space.id);
      toast.success('Espaço deletado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar espaço');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Espaço</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o espaço <strong>"{space?.name}"</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Todos os posts, comentários e conteúdo deste espaço serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteSpaceMutation.isPending}
          >
            {deleteSpaceMutation.isPending ? 'Deletando...' : 'Deletar Espaço'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};