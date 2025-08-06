import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EyeOff, Eye, MoreVertical } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useHidePost, useUnhidePost } from '@/hooks/usePostModerationActions';
import { useUserRole } from '@/hooks/useUserRole';

interface PostModerationActionsProps {
  postId: string;
  isHidden: boolean;
  hiddenReason?: string;
  className?: string;
}

export const PostModerationActions: React.FC<PostModerationActionsProps> = ({ 
  postId, 
  isHidden, 
  hiddenReason,
  className 
}) => {
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  
  const { data: userRole } = useUserRole();
  const hidePost = useHidePost();
  const unhidePost = useUnhidePost();

  // Only show for company owners/admins
  if (!userRole?.role || (userRole.role !== 'owner' && userRole.role !== 'admin')) {
    return null;
  }

  const handleHidePost = () => {
    hidePost.mutate({ postId, reason: reason.trim() || undefined });
    setHideDialogOpen(false);
    setReason('');
  };

  const handleUnhidePost = () => {
    unhidePost.mutate({ postId });
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isHidden ? (
            <DropdownMenuItem onClick={handleUnhidePost} disabled={unhidePost.isPending}>
              <Eye className="h-4 w-4 mr-2" />
              Reexibir postagem
            </DropdownMenuItem>
          ) : (
            <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar postagem
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ocultar Postagem</DialogTitle>
                  <DialogDescription>
                    Esta postagem será ocultada para todos os usuários, exceto para administradores e o autor.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Motivo (opcional)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Digite o motivo para ocultar esta postagem..."
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setHideDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleHidePost} 
                    disabled={hidePost.isPending}
                    variant="destructive"
                  >
                    {hidePost.isPending ? 'Ocultando...' : 'Ocultar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {isHidden && hiddenReason && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800 font-medium">Postagem oculta</p>
          <p className="text-yellow-700">Motivo: {hiddenReason}</p>
        </div>
      )}
    </div>
  );
};