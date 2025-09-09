import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LessonBannerSection } from './LessonBannerSection';

interface LessonBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
}

export const LessonBannerDialog = ({ 
  open, 
  onOpenChange, 
  lessonId, 
  lessonTitle 
}: LessonBannerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Banner da Aula</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <LessonBannerSection 
            lessonId={lessonId} 
            lessonTitle={lessonTitle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};