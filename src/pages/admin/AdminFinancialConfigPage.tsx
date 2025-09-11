import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentConfigTab } from '@/components/admin/payments/PaymentConfigTab';

export const AdminFinancialConfigPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuração de Pagamentos</h1>
          <p className="text-muted-foreground">
            Configure os provedores de pagamento e métodos aceitos
          </p>
        </div>
        
        <PaymentConfigTab />
      </div>
    </AdminLayout>
  );
};