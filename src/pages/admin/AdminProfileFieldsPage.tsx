import { AdminLayout } from '@/components/admin/AdminLayout';
import { CustomProfileFieldsManagement } from '@/components/admin/CustomProfileFieldsManagement';

export const AdminProfileFieldsPage = () => {
  return (
    <AdminLayout>
      <CustomProfileFieldsManagement />
    </AdminLayout>
  );
};