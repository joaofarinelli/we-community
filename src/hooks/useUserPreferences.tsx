import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { useSpaceCategories } from './useSpaceCategories';

interface UserPreferences {
  expanded_categories: string[];
  sidebar_collapsed?: boolean;
  theme?: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  expanded_categories: [], // Iniciará vazio, será populado na primeira vez
  sidebar_collapsed: false,
  theme: 'light',
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { data: categories = [] } = useSpaceCategories();
  const queryClient = useQueryClient();
  const [localPreferences, setLocalPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Query to fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['userPreferences', user?.id, company?.id],
    queryFn: async () => {
      if (!user || !company) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .eq('company_id', company.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return (data?.preferences as unknown as UserPreferences) || DEFAULT_PREFERENCES;
    },
    enabled: !!user && !!company,
  });

  // Mutation to save preferences
  const { mutate: savePreferences } = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      if (!user || !company) throw new Error('User or company not found');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          company_id: company.id,
          preferences: newPreferences as any,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id, company?.id] });
    },
  });

  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    } else if (!isLoading && categories.length > 0 && !preferences) {
      // Se não há preferências salvas e temos categorias, é primeira vez - expandir todas
      const defaultExpanded = categories.map(cat => cat.id);
      const newPreferences = {
        ...DEFAULT_PREFERENCES,
        expanded_categories: defaultExpanded,
      };
      setLocalPreferences(newPreferences);
      savePreferences(newPreferences);
      setIsFirstTime(true);
    }
  }, [preferences, isLoading, categories, savePreferences]);

  // Function to update expanded categories
  const updateExpandedCategories = useCallback((categories: string[]) => {
    const newPreferences = {
      ...localPreferences,
      expanded_categories: categories,
    };
    setLocalPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [localPreferences, savePreferences]);

  // Function to toggle a specific category
  const toggleCategory = useCallback((categoryId: string) => {
    const currentExpanded = localPreferences.expanded_categories;
    const newExpanded = currentExpanded.includes(categoryId)
      ? currentExpanded.filter(id => id !== categoryId)
      : [...currentExpanded, categoryId];
    
    updateExpandedCategories(newExpanded);
  }, [localPreferences.expanded_categories, updateExpandedCategories]);

  // Function to check if category is expanded
  const isCategoryExpanded = useCallback((categoryId: string) => {
    return localPreferences.expanded_categories.includes(categoryId);
  }, [localPreferences.expanded_categories]);

  return {
    preferences: localPreferences,
    isLoading,
    updateExpandedCategories,
    toggleCategory,
    isCategoryExpanded,
  };
};