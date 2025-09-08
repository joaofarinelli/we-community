import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface UnmetPrerequisite {
  id: string;
  name: string;
}

interface TrailStartEligibility {
  canStart: boolean;
  unmetPrerequisites: UnmetPrerequisite[];
  isLoading: boolean;
  error: string | null;
}

export const useTrailStartEligibility = (templateId: string): TrailStartEligibility => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ['trail-start-eligibility', templateId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !templateId) {
        throw new Error('Missing required data');
      }

      // Get template access criteria
      const { data: template, error: templateError } = await supabase
        .from('trail_templates')
        .select('access_criteria, name')
        .eq('id', templateId)
        .eq('company_id', currentCompanyId)
        .single();

      if (templateError) throw templateError;

      const accessCriteria = template.access_criteria || {};
      const requiredTemplateIds = (accessCriteria as any).required_trail_template_ids || [];

      // If no prerequisites, user can start
      if (requiredTemplateIds.length === 0) {
        return {
          canStart: true,
          unmetPrerequisites: []
        };
      }

      // Get user's completed trails
      const { data: userTrails, error: trailsError } = await supabase
        .from('trails')
        .select('template_id, status, completed_at, progress_percentage')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId);

      if (trailsError) throw trailsError;

      const completedTemplateIds = userTrails
        ?.filter(trail => 
          trail.status === 'completed' || 
          trail.completed_at || 
          trail.progress_percentage === 100
        )
        .map(trail => trail.template_id) || [];

      // Find unmet prerequisites
      const unmetTemplateIds = requiredTemplateIds.filter(
        (reqId: string) => !completedTemplateIds.includes(reqId)
      );

      if (unmetTemplateIds.length === 0) {
        return {
          canStart: true,
          unmetPrerequisites: []
        };
      }

      // Get names of unmet prerequisite templates
      const { data: unmetTemplates, error: unmetError } = await supabase
        .from('trail_templates')
        .select('id, name')
        .in('id', unmetTemplateIds)
        .eq('company_id', currentCompanyId);

      if (unmetError) throw unmetError;

      const unmetPrerequisites = unmetTemplates?.map(template => ({
        id: template.id,
        name: template.name
      })) || [];

      return {
        canStart: false,
        unmetPrerequisites
      };
    },
    enabled: !!user?.id && !!currentCompanyId && !!templateId
  });

  return {
    canStart: data?.canStart || false,
    unmetPrerequisites: data?.unmetPrerequisites || [],
    isLoading,
    error: error?.message || null
  };
};