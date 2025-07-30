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
  is_active: boolean;
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

      // Buscar todos os profiles da empresa
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, role, is_active, created_at')
        .eq('company_id', userProfile.company_id);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Buscar user_roles para complementar informações (se existir)
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('company_id', userProfile.company_id)
        .in('user_id', userIds);

      // Combinar os dados, priorizando o role da tabela profiles
      return profiles?.map((profile: any) => {
        const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || 'email@exemplo.com',
          display_name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`.trim() 
            : profile.first_name || 'Nome não encontrado',
          avatar_url: profile.user_id === user.id ? user.user_metadata?.avatar_url : null,
          created_at: userRole?.created_at || profile.created_at,
          role: profile.role || userRole?.role || 'member', // Prioriza role da tabela profiles
          is_active: profile.is_active ?? true
        };
      }) as CompanyMember[] || [];
    },
    enabled: !!user?.id,
  });
};