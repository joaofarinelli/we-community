import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from '@/hooks/use-toast';

interface BulkNotificationData {
  title: string;
  content: string;
  userIds: string[];
}

interface BulkAnnouncementData {
  title: string;
  content: string;
  isMandatory: boolean;
  expiresAt?: string;
  userIds: string[];
}

interface BulkCourseAccessData {
  courseId: string;
  userIds: string[];
}

interface BulkSpaceAccessData {
  spaceId: string;
  userIds: string[];
}

export const useBulkActions = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const bulkSendNotifications = useMutation({
    mutationFn: async (data: BulkNotificationData) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: result, error } = await supabase.rpc('bulk_send_notifications', {
        p_company_id: currentCompanyId,
        p_title: data.title,
        p_content: data.content,
        p_user_ids: data.userIds
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (count) => {
      toast({
        title: 'Notificações enviadas',
        description: `${count} notificações foram enviadas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error sending bulk notifications:', error);
      toast({
        title: 'Erro ao enviar notificações',
        description: 'Ocorreu um erro ao enviar as notificações.',
        variant: 'destructive',
      });
    },
  });

  const createBulkAnnouncement = useMutation({
    mutationFn: async (data: BulkAnnouncementData) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: result, error } = await supabase.rpc('create_announcement_and_assign', {
        p_company_id: currentCompanyId,
        p_title: data.title,
        p_content: data.content,
        p_is_mandatory: data.isMandatory,
        p_expires_at: data.expiresAt || null,
        p_user_ids: data.userIds
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (announcementId, variables) => {
      toast({
        title: 'Anúncio criado',
        description: `Anúncio ${variables.isMandatory ? 'obrigatório' : 'opcional'} enviado para ${variables.userIds.length} usuários.`,
      });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => {
      console.error('Error creating bulk announcement:', error);
      toast({
        title: 'Erro ao criar anúncio',
        description: 'Ocorreu um erro ao criar o anúncio.',
        variant: 'destructive',
      });
    },
  });

  const bulkGrantCourseAccess = useMutation({
    mutationFn: async (data: BulkCourseAccessData) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: result, error } = await supabase.rpc('bulk_grant_course_access', {
        p_company_id: currentCompanyId,
        p_course_id: data.courseId,
        p_user_ids: data.userIds
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (count, variables) => {
      toast({
        title: 'Acesso ao curso concedido',
        description: `${count} usuários receberam acesso ao curso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-course-access'] });
    },
    onError: (error) => {
      console.error('Error granting bulk course access:', error);
      toast({
        title: 'Erro ao conceder acesso',
        description: 'Ocorreu um erro ao conceder acesso ao curso.',
        variant: 'destructive',
      });
    },
  });

  const bulkGrantSpaceAccess = useMutation({
    mutationFn: async (data: BulkSpaceAccessData) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: result, error } = await supabase.rpc('bulk_grant_space_access', {
        p_company_id: currentCompanyId,
        p_space_id: data.spaceId,
        p_user_ids: data.userIds
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (count, variables) => {
      toast({
        title: 'Acesso ao espaço concedido',
        description: `${count} usuários receberam acesso ao espaço.`,
      });
      queryClient.invalidateQueries({ queryKey: ['space-members'] });
    },
    onError: (error) => {
      console.error('Error granting bulk space access:', error);
      toast({
        title: 'Erro ao conceder acesso',
        description: 'Ocorreu um erro ao conceder acesso ao espaço.',
        variant: 'destructive',
      });
    },
  });

  return {
    bulkSendNotifications,
    createBulkAnnouncement,
    bulkGrantCourseAccess,
    bulkGrantSpaceAccess,
  };
};