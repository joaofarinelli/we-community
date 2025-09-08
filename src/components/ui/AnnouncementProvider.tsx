import { useState, useEffect } from 'react';
import { AnnouncementModal } from './AnnouncementModal';
import { useUserAnnouncements, AnnouncementRecipient } from '@/hooks/useAnnouncements';

export function AnnouncementProvider() {
  const { data: announcements = [] } = useUserAnnouncements();
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementRecipient | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Show the first pending announcement
    if (announcements.length > 0 && !currentAnnouncement) {
      const firstAnnouncement = announcements[0];
      setCurrentAnnouncement(firstAnnouncement);
      setModalOpen(true);
    }
  }, [announcements, currentAnnouncement]);

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentAnnouncement(null);
    
    // Check if there are more announcements to show
    const remainingAnnouncements = announcements.filter(a => a.id !== currentAnnouncement?.id);
    if (remainingAnnouncements.length > 0) {
      setTimeout(() => {
        setCurrentAnnouncement(remainingAnnouncements[0]);
        setModalOpen(true);
      }, 500); // Small delay between announcements
    }
  };

  return (
    <AnnouncementModal
      announcement={currentAnnouncement}
      open={modalOpen}
      onOpenChange={handleModalClose}
    />
  );
}