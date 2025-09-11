import { AdminLayout } from '@/components/admin/AdminLayout';
import { FinancialDashboard } from '@/components/admin/financial/FinancialDashboard';

export const AdminFinancialReportsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho financeiro
          </p>
        </div>
        
        <FinancialDashboard />
      </div>
    </AdminLayout>
  );
};