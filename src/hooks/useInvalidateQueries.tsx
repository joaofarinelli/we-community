import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';

/**
 * Hook para invalidação padronizada de queries com companyId
 * Garante que todas as invalidações sejam específicas por empresa
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  const invalidateQuery = (baseKey: string, ...additionalKeys: (string | undefined)[]) => {
    const queryKey = [baseKey, currentCompanyId, ...additionalKeys.filter(Boolean)];
    console.log('🔄 Invalidating query:', queryKey);
    return queryClient.invalidateQueries({ queryKey });
  };

  // Métodos específicos para recursos comuns
  const invalidateSpaces = (categoryId?: string) => {
    invalidateQuery('spaces', categoryId);
    invalidateQuery('userSpaces', categoryId);
  };

  const invalidateSpaceCategories = () => {
    invalidateQuery('spaceCategories');
  };

  const invalidateUserProfile = (userId?: string) => {
    invalidateQuery('userProfile', userId);
    invalidateQuery('userProfileForCompany', userId);
    invalidateQuery('user-custom-profile-data', userId);
  };

  const invalidateAccessGroups = () => {
    invalidateQuery('access-groups');
  };

  const invalidateCourses = () => {
    invalidateQuery('courses');
    invalidateQuery('user-course-access');
  };

  const invalidateCompanyData = () => {
    invalidateQuery('company');
    invalidateQuery('company-features');
    invalidateQuery('whatsapp-config');
  };

  const invalidateSegments = () => {
    invalidateQuery('segments');
  };

  const invalidateEvents = () => {
    invalidateQuery('events');
    invalidateQuery('allUserEvents');
  };

  const invalidatePosts = (spaceId?: string) => {
    invalidateQuery('posts', spaceId);
  };

  const invalidateNotifications = () => {
    invalidateQuery('notifications');
    invalidateQuery('user-announcements');
  };

  const invalidateBannedWords = () => {
    invalidateQuery('bannedWords');
  };

  const invalidateBulkActions = () => {
    invalidateQuery('bulk-actions');
    invalidateQuery('bulk-action-executions');
  };

  const invalidateChallenges = () => {
    invalidateQuery('challenges');
    invalidateQuery('challenge-participations');
    invalidateQuery('challenge-submissions');
    invalidateQuery('admin-challenge-submissions');
  };

  // Invalidação em cascade - quando o contexto da empresa muda
  const invalidateAllCompanyData = () => {
    if (!currentCompanyId) return;
    
    console.log('🔄 Invalidating ALL company data for:', currentCompanyId);
    
    // Invalidar todas as queries que dependem de companyId
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && 
               queryKey.length > 1 && 
               queryKey[1] === currentCompanyId;
      }
    });
  };

  return {
    invalidateQuery,
    invalidateSpaces,
    invalidateSpaceCategories,
    invalidateUserProfile,
    invalidateAccessGroups,
    invalidateCourses,
    invalidateCompanyData,
    invalidateSegments,
    invalidateEvents,
    invalidatePosts,
    invalidateNotifications,
    invalidateBannedWords,
    invalidateBulkActions,
    invalidateChallenges,
    invalidateAllCompanyData,
  };
};