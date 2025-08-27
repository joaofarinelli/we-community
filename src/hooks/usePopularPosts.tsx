import { useAllPosts } from './useAllPosts';

export const usePopularPosts = (limit: number = 5) => {
  const { data: allPosts, isLoading, error } = useAllPosts('popular');
  
  const posts = allPosts?.slice(0, limit) || [];
  
  return {
    data: posts,
    isLoading,
    error,
  };
};