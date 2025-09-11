import { AdminLayout } from '@/components/admin/AdminLayout';
import { TransactionsList } from '@/components/admin/financial/TransactionsList';

export const AdminFinancialTransactionsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendas & Transações</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as transações de pagamento
          </p>
        </div>
        
        <TransactionsList />
      </div>
    </AdminLayout>
  );
};