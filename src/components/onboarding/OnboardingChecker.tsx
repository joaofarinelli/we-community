import { useEffect, useState } from 'react';
import { useOnboardingAssignment } from '@/hooks/useOnboardingAssignment';
import { OnboardingWizard } from './OnboardingWizard';

export const OnboardingChecker = () => {
  const { assignment, isLoadingAssignment } = useOnboardingAssignment();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoadingAssignment && assignment && 
        (assignment.status === 'pending' || assignment.status === 'in_progress')) {
      setShowOnboarding(true);
    }
  }, [assignment, isLoadingAssignment]);

  const handleClose = () => {
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <OnboardingWizard 
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
};