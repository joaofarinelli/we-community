import { PostDialog } from './PostDialog';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialTitle?: string;
  initialContent: string;
}

export const EditPostDialog = ({ 
  open, 
  onOpenChange, 
  postId, 
  initialTitle, 
  initialContent 
}: EditPostDialogProps) => {
  return (
    <PostDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="edit"
      postId={postId}
      initialTitle={initialTitle}
      initialContent={initialContent}
    />
  );
};