import { AdminLayout } from '@/components/admin/AdminLayout';
import { ChallengeSubmissionsReview } from '@/components/admin/ChallengeSubmissionsReview';

export const AdminChallengeSubmissionsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Submissões de Desafios</h1>
          <p className="text-muted-foreground">
            Revise e aprove ou rejeite as submissões dos usuários para desafios baseados em prova.
          </p>
        </div>

        <ChallengeSubmissionsReview />
      </div>
    </AdminLayout>
  );
};