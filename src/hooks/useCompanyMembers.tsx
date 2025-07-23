import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CompanyMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
}

export const useCompanyMembers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar todos os usuários com roles na empresa
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `);

      if (error) {
        console.error('Error fetching company members:', error);
        return [];
      }

      // Por enquanto, vamos mostrar apenas o usuário atual como membro
      // Em uma implementação completa, você precisaria de uma tabela de profiles
      const currentUserMember = data.find(userRole => userRole.user_id === user.id);
      
      if (!currentUserMember) return [];

      return [{
        id: currentUserMember.id,
        user_id: currentUserMember.user_id,
        email: user.email || '',
        display_name: user.user_metadata?.display_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: currentUserMember.created_at,
        role: currentUserMember.role
      }] as CompanyMember[];
    },
    enabled: !!user?.id,
  });
};