import { PostDialog } from './PostDialog';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSpaceId?: string;
}

export const CreatePostDialog = ({ open, onOpenChange, initialSpaceId }: CreatePostDialogProps) => {
  return (
    <PostDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      initialSpaceId={initialSpaceId}
    />
  );
};