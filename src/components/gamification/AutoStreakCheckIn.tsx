import { useEffect, useState } from 'react';
import { StreakDialog } from './StreakDialog';
import { useUserStreak } from '@/hooks/useUserStreak';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export const AutoStreakCheckIn = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { streak, needsCheckInToday, isLoading } = useUserStreak();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  useEffect(() => {
    // Reset the "has shown today" flag when the date changes
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('streak-dialog-shown-date');
    
    if (lastShown !== today) {
      setHasShownToday(false);
      localStorage.removeItem('streak-dialog-shown-date');
    }
  }, []);

  useEffect(() => {
    // Only show dialog if:
    // 1. User is authenticated
    // 2. Company is selected
    // 3. Data is loaded
    // 4. User needs check-in today
    // 5. Haven't shown dialog today yet
    if (
      user?.id &&
      currentCompanyId &&
      !isLoading &&
      streak &&
      needsCheckInToday() &&
      !hasShownToday
    ) {
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem('streak-dialog-shown-date');
      
      // Only show if we haven't shown today
      if (lastShown !== today) {
        setDialogOpen(true);
        setHasShownToday(true);
        localStorage.setItem('streak-dialog-shown-date', today);
      }
    }
  }, [user?.id, currentCompanyId, isLoading, streak, needsCheckInToday, hasShownToday]);

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Mark as shown for today when dialog is closed
      const today = new Date().toDateString();
      localStorage.setItem('streak-dialog-shown-date', today);
      setHasShownToday(true);
    }
  };

  return (
    <StreakDialog open={dialogOpen} onOpenChange={handleDialogClose}>
      <></>
    </StreakDialog>
  );
};