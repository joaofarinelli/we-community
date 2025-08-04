import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useDeleteCategory } from '@/hooks/useDeleteCategory';
import { toast } from 'sonner';

interface DeleteCategoryDialogProps {
  category: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteCategoryDialog = ({ category, isOpen, onOpenChange }: DeleteCategoryDialogProps) => {
  const deleteCategoryMutation = useDeleteCategory();

  const handleDelete = () => {
    deleteCategoryMutation.deleteCategory(category.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar a categoria <strong>"{category?.name}"</strong>?
            <br /><br />
            Esta ação não pode ser desfeita. Os espaços desta categoria ficarão sem categoria, mas não serão deletados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteCategoryMutation.isLoading}
          >
            {deleteCategoryMutation.isLoading ? 'Deletando...' : 'Deletar Categoria'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};