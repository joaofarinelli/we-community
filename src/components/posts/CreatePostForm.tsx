import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreatePostDialog } from './CreatePostDialog';

interface CreatePostFormProps {
  spaceId: string;
}

export const CreatePostForm = ({ spaceId }: CreatePostFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card 
        className="w-full cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                U
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder="Criar uma publicação..."
                className="min-h-[60px] resize-none border-none shadow-none focus-visible:ring-0 p-0 cursor-pointer"
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