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
        .maybeSingle();

      if (profileError || !userProfile?.company_id) {
        console.error('Error fetching user profile:', profileError);
        return [];
      }

      // Buscar todos os user_roles da empresa
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .eq('company_id', userProfile.company_id);

      if (rolesError || !userRoles) {
        console.error('Error fetching user roles:', rolesError);
        return [];
      }

      // Buscar os profiles correspondentes
      const userIds = userRoles.map(role => role.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Combinar os dados
      return userRoles.map((userRole: any) => {
        const profile = profiles?.find(p => p.user_id === userRole.user_id);
        return {
          id: userRole.id,
          user_id: userRole.user_id,
          email: userRole.user_id === user.id ? user.email : 'email@exemplo.com',
          display_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Nome não encontrado',
          avatar_url: userRole.user_id === user.id ? user.user_metadata?.avatar_url : null,
          created_at: userRole.created_at,
          role: userRole.role
        };
      }) as CompanyMember[];
    },
    enabled: !!user?.id,
  });
};