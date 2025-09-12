import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementRecipient } from '@/hooks/useAnnouncements';
import { toast } from '@/hooks/use-toast';

interface AnnouncementModalProps {
  announcement: AnnouncementRecipient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementModal({ announcement, open, onOpenChange }: AnnouncementModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const updateAnnouncementStatus = useMutation({
    mutationFn: async ({ status }: { status: 'viewed' | 'dismissed' }) => {
      if (!announcement) return;

      const updateData: any = {
        status,
      };

      if (status === 'viewed') {
        updateData.viewed_at = new Date().toISOString();
      } else if (status === 'dismissed') {
        updateData.dismissed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('announcement_recipients')
        .update(updateData)
        .eq('id', announcement.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-announcements'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating announcement status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do anúncio.',
        variant: 'destructive',
      });
    },
  });

  const handleView = async () => {
    if (!announcement?.announcement.is_mandatory) {
      // For non-mandatory announcements, just mark as viewed and close
      await updateAnnouncementStatus.mutateAsync({ status: 'viewed' });
      return;
    }
    
    // For mandatory announcements, mark as viewed but keep modal open
    setIsProcessing(true);
    try {
      await updateAnnouncementStatus.mutateAsync({ status: 'viewed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    if (!announcement) return;
    
    setIsProcessing(true);
    try {
      await updateAnnouncementStatus.mutateAsync({ status: 'dismissed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!announcement?.announcement.is_mandatory) {
      onOpenChange(false);
    }
  };

  if (!announcement) return null;

  const { announcement: announcementData } = announcement;
  const isValidExpiryDate = announcementData.expires_at && !isNaN(new Date(announcementData.expires_at).getTime());
  const isExpired = isValidExpiryDate && new Date(announcementData.expires_at) < new Date();
  const isValidCreatedDate = announcementData.created_at && !isNaN(new Date(announcementData.created_at).getTime());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-lg"
        onPointerDownOutside={(e) => {
          if (announcementData.is_mandatory) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (announcementData.is_mandatory) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <DialogTitle>{announcementData.title}</DialogTitle>
            </div>
            <div className="flex gap-2">
              {announcementData.is_mandatory && (
                <Badge variant="destructive" className="text-xs">
                  Obrigatório
                </Badge>
              )}
              {isExpired && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Expirado
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {isValidCreatedDate 
                ? format(new Date(announcementData.created_at), 'Pp', { locale: ptBR })
                : 'Data não disponível'
              }
            </span>
          </div>
          
          {isValidExpiryDate && !isExpired && (
            <DialogDescription className="text-sm">
              Expira em: {format(new Date(announcementData.expires_at), 'Pp', { locale: ptBR })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-4">
          {announcementData.image_url && (
            <div className="mb-4">
              <img
                src={announcementData.image_url}
                alt="Imagem do anúncio"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{announcementData.content}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {announcementData.is_mandatory ? (
            <>
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Dispensar
              </Button>
              <Button
                onClick={handleView}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aceitar
              </Button>
            </>
          ) : (
            <Button onClick={handleView} disabled={isProcessing}>
              Entendi
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
