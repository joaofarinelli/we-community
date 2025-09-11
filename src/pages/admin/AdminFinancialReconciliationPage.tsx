import { AdminLayout } from '@/components/admin/AdminLayout';
import { ReconciliationTool } from '@/components/admin/financial/ReconciliationTool';

export const AdminFinancialReconciliationPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reconciliação</h1>
          <p className="text-muted-foreground">
            Confira e sincronize pagamentos pendentes
          </p>
        </div>
        
        <ReconciliationTool />
      </div>
    </AdminLayout>
  );
};