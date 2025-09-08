import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { BulkActionsDialog } from './BulkActionsDialog';
import { FilteredUser, UserFilters } from '@/hooks/useCompanyUsersWithFilters';
import { useAllFilteredUsers } from '@/hooks/useCompanyUsersWithFilters';

interface BulkActionsButtonProps {
  filters: UserFilters;
  disabled?: boolean;
}

export function BulkActionsButton({ filters, disabled }: BulkActionsButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: filteredUsers = [] } = useAllFilteredUsers(filters);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
        disabled={disabled || filteredUsers.length === 0}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Ações em Massa ({filteredUsers.length})
      </Button>

      <BulkActionsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        filteredUsers={filteredUsers}
        filters={filters}
      />
    </>
  );
}