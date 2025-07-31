import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BankHeader } from '@/components/bank/BankHeader';
import { TransactionStatement } from '@/components/bank/TransactionStatement';
import { TransferForm } from '@/components/bank/TransferForm';
import { PageBanner } from '@/components/ui/page-banner';

export const BankPage = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <PageBanner bannerType="bank" />
        <BankHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TransactionStatement />
          </div>
          
          <div>
            <TransferForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};