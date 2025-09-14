import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useUserProfile } from './useUserProfile';
import { useUserLevel } from './useUserLevel';
import { useUserTags } from './useUserTags';

export interface TrailAccessCriteria {
  required_level_id?: string;
  required_tags?: string[];
  required_roles?: string[];
  required_trail_template_ids?: string[];
  is_available_for_all?: boolean;
}

export const useTrailAccess = (templateId: string, accessCriteria?: TrailAccessCriteria) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: userProfile } = useUserProfile();
  const { data: userLevel } = useUserLevel();
  const { data: userTags } = useUserTags(user?.id || '');

  return useQuery({
    queryKey: ['trail-access', templateId, currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId || !accessCriteria) return true;

      // Se está disponível para todos, permitir acesso
      if (accessCriteria.is_available_for_all) {
        return true;
      }

      let hasAccess = true;

      // Verificar nível exigido
      if (accessCriteria.required_level_id && userLevel) {
        hasAccess = hasAccess && userLevel.current_level_id === accessCriteria.required_level_id;
      }

      // Verificar tags exigidas
      if (accessCriteria.required_tags && accessCriteria.required_tags.length > 0) {
        const userTagNames = userTags?.map(tag => tag.tags.name) || [];
        const hasRequiredTags = accessCriteria.required_tags.every(tag => 
          userTagNames.includes(tag)
        );
        hasAccess = hasAccess && hasRequiredTags;
      }

      // Verificar função exigida
      if (accessCriteria.required_roles && accessCriteria.required_roles.length > 0) {
        hasAccess = hasAccess && userProfile && 
          accessCriteria.required_roles.includes(userProfile.role);
      }

      return hasAccess;
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useCheckTrailTemplateAccess = (templateId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-template-access', templateId, currentCompanyId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return false;

      const { data: template, error } = await supabase
        .from('trail_templates')
        .select('access_criteria')
        .eq('id', templateId)
        .eq('company_id', currentCompanyId)
        .single();

      if (error || !template) return false;

      const accessCriteria = template.access_criteria as TrailAccessCriteria || {
        is_available_for_all: true
      };

      // Se está disponível para todos, permitir acesso
      if (accessCriteria.is_available_for_all) {
        return true;
      }

      // Buscar dados do usuário para verificar acesso
      const [userProfile, userLevel, userTags] = await Promise.all([
        supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', currentCompanyId)
          .single(),
        supabase
          .from('user_current_level')
          .select('current_level_id')
          .eq('user_id', user.id)
          .eq('company_id', currentCompanyId)
          .single(),
        supabase
          .from('user_tags')
          .select(`
            tag_id,
            tags!inner (
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('company_id', currentCompanyId)
      ]);

      let hasAccess = true;

      // Verificar nível exigido
      if (accessCriteria.required_level_id && userLevel.data) {
        hasAccess = hasAccess && userLevel.data.current_level_id === accessCriteria.required_level_id;
      }

      // Verificar tags exigidas
      if (accessCriteria.required_tags && accessCriteria.required_tags.length > 0) {
        const userTagNames = (userTags.data as any)?.map((tag: any) => tag.tags?.name) || [];
        const hasRequiredTags = accessCriteria.required_tags.every((tag: any) => 
          userTagNames.includes(tag)
        );
        hasAccess = hasAccess && hasRequiredTags;
      }

      // Verificar função exigida
      if (accessCriteria.required_roles && accessCriteria.required_roles.length > 0) {
        hasAccess = hasAccess && userProfile.data && 
          accessCriteria.required_roles.includes(userProfile.data.role);
      }

      return hasAccess;
    },
    enabled: !!user && !!currentCompanyId && !!templateId,
  });
};