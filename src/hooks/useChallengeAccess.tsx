import { useMemo } from 'react';
import { useUserTags } from './useUserTags';
import { useAuth } from './useAuth';

// Hook para verificar se o usuário tem acesso a desafios baseado em tags
export const useChallengeAccess = () => {
  const { user } = useAuth();
  const { data: userTags } = useUserTags(user?.id || '');

  const hasAccessToChallenge = useMemo(() => {
    return (challengeAccessTags: string[]) => {
      // Se o desafio não tem tags de acesso específicas, é acessível a todos
      if (!challengeAccessTags || challengeAccessTags.length === 0) {
        return true;
      }

      // Se o usuário não tem tags, não pode acessar desafios com restrições
      if (!userTags || userTags.length === 0) {
        return false;
      }

      // Verifica se o usuário tem pelo menos uma das tags necessárias
      const userTagNames = userTags.map(tag => tag.tags.name);
      return challengeAccessTags.some(requiredTag => 
        userTagNames.includes(requiredTag)
      );
    };
  }, [userTags]);

  return {
    hasAccessToChallenge,
    userTags
  };
};

// Hook para filtrar desafios baseado no acesso por tags
export const useFilteredChallengesByAccess = (challenges: any[]) => {
  const { hasAccessToChallenge } = useChallengeAccess();

  return useMemo(() => {
    if (!challenges) return [];

    return challenges.filter(challenge => 
      hasAccessToChallenge(challenge.access_tags || [])
    );
  }, [challenges, hasAccessToChallenge]);
};