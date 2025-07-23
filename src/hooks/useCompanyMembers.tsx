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

      // Buscar a empresa do usuário atual
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile?.company_id) {
        console.error('Error fetching user profile:', profileError);
        return [];
      }

      // Buscar todos os membros da empresa com suas informações de perfil
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles!inner (
            first_name,
            last_name,
            company_id
          )
        `)
        .eq('company_id', userProfile.company_id);

      if (error) {
        console.error('Error fetching company members:', error);
        return [];
      }

      return data.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        email: member.user_id === user.id ? user.email : 'email@exemplo.com', // Para outros usuários, precisaríamos de uma tabela separada
        display_name: `${member.profiles.first_name} ${member.profiles.last_name}`.trim(),
        avatar_url: member.user_id === user.id ? user.user_metadata?.avatar_url : null,
        created_at: member.created_at,
        role: member.role
      })) as CompanyMember[];
    },
    enabled: !!user?.id,
  });
};