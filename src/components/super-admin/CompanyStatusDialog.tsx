import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSuperAdminCompanyActions } from "@/hooks/useSuperAdminCompanyActions";

interface CompanyStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export const CompanyStatusDialog = ({ open, onOpenChange, company }: CompanyStatusDialogProps) => {
  const { toggleCompanyStatus } = useSuperAdminCompanyActions();

  if (!company) return null;

  const isActive = company.status === 'active';
  const newStatus = isActive ? 'inactive' : 'active';
  const action = isActive ? 'desativar' : 'ativar';
  const actionPast = isActive ? 'desativada' : 'ativada';

  const handleConfirm = () => {
    toggleCompanyStatus.mutate(
      { id: company.id, status: newStatus as 'active' | 'inactive' },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirmar {action === 'ativar' ? 'Ativação' : 'Desativação'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja {action} a empresa "{company.name}"?
            {!isActive && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <strong>Atenção:</strong> Ao ativar esta empresa, ela voltará a ter acesso completo ao sistema.
              </div>
            )}
            {isActive && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <strong>Atenção:</strong> Ao desativar esta empresa:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Usuários não conseguirão fazer login</li>
                  <li>O acesso ao sistema será bloqueado</li>
                  <li>Os dados serão preservados</li>
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={toggleCompanyStatus.isPending}
            className={isActive ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {toggleCompanyStatus.isPending 
              ? `${action === 'ativar' ? 'Ativando' : 'Desativando'}...` 
              : `${action === 'ativar' ? 'Ativar' : 'Desativar'} Empresa`
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};