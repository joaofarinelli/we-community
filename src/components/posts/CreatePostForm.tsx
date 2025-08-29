import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreatePostDialog } from './CreatePostDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

interface CreatePostFormProps {
  spaceId: string;
}

export const CreatePostForm = ({ spaceId }: CreatePostFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: profile } = useUserProfile();

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <Card 
        className="w-full cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={profile?.avatar_url} 
                alt={`${profile?.first_name} ${profile?.last_name}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder="Criar uma publicação..."
                className="min-h-[60px] resize-none border-none shadow-none focus-visible:ring-0 p-3 cursor-pointer"
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <CreatePostDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialSpaceId={spaceId}
      />
    </>
  );
};