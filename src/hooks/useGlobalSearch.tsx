import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'user' | 'course' | 'module' | 'lesson';
  title: string;
  content?: string;
  author?: string;
  created_at?: string;
  url?: string;
}

export const useGlobalSearch = (query: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['global-search', query, user?.id, currentCompanyId],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!user || !query || query.length < 2 || !currentCompanyId) return [];

      const results: SearchResult[] = [];
      const searchTerm = `%${query}%`;

      // Helper function to strip HTML tags and decode entities
      const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      try {

        // Search Posts
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            id, title, content, created_at,
            profiles!posts_author_profile_fkey(first_name, last_name)
          `)
          .eq('company_id', currentCompanyId)
          .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
          .limit(10);

        if (posts) {
          results.push(...posts.map(post => ({
            id: post.id,
            type: 'post' as const,
            title: post.title || 'Post sem título',
            content: post.content ? stripHtml(post.content).substring(0, 100) + '...' : '',
            author: post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : 'Usuário',
            created_at: post.created_at
            // Remove URL since posts are displayed in dialogs, not separate pages
          })));
        }

        // Search Comments
        const { data: comments } = await supabase
          .from('post_interactions')
          .select(`
            id, comment_text, created_at,
            profiles!post_interactions_user_profile_fkey(first_name, last_name),
            posts!post_interactions_post_id_fkey(title)
          `)
          .eq('type', 'comment')
          .ilike('comment_text', searchTerm)
          .not('comment_text', 'is', null)
          .limit(10);

        if (comments) {
          results.push(...comments.map(comment => ({
            id: comment.id,
            type: 'comment' as const,
            title: `Comentário em: ${comment.posts?.title || 'Post'}`,
            content: comment.comment_text ? stripHtml(comment.comment_text).substring(0, 100) + '...' : '',
            author: comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Usuário',
            created_at: comment.created_at
          })));
        }

        // Search Users
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, created_at')
          .eq('company_id', currentCompanyId)
          .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
          .limit(10);

        if (users) {
          results.push(...users.map(userProfile => ({
            id: userProfile.user_id,
            type: 'user' as const,
            title: `${userProfile.first_name} ${userProfile.last_name}`,
            content: 'Membro da comunidade',
            created_at: userProfile.created_at,
            url: `/dashboard/user/${userProfile.user_id}`
          })));
        }

        // Search Courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, description, created_at')
          .eq('company_id', currentCompanyId)
          .eq('is_active', true)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);

        if (courses) {
          results.push(...courses.map(course => ({
            id: course.id,
            type: 'course' as const,
            title: course.title,
            content: course.description?.substring(0, 100) + '...',
            created_at: course.created_at,
            url: `/dashboard/courses/${course.id}`
          })));
        }

        // Search Modules
        const { data: modules } = await supabase
          .from('course_modules')
          .select(`
            id, title, description, created_at,
            courses!course_modules_course_id_fkey(title, company_id)
          `)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);

        if (modules) {
          const filteredModules = modules.filter(module => 
            module.courses?.company_id === currentCompanyId
          );
          
          results.push(...filteredModules.map(module => ({
            id: module.id,
            type: 'module' as const,
            title: module.title,
            content: `Módulo do curso: ${module.courses?.title}`,
            created_at: module.created_at,
            url: `/dashboard/courses/${module.courses}/modules/${module.id}`
          })));
        }

        // Search Lessons
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select(`
            id, title, description, created_at,
            course_modules!course_lessons_module_id_fkey(
              title,
              courses!course_modules_course_id_fkey(title, company_id)
            )
          `)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(10);

        if (lessons) {
          const filteredLessons = lessons.filter(lesson => 
            lesson.course_modules?.courses?.company_id === currentCompanyId
          );
          
          results.push(...filteredLessons.map(lesson => ({
            id: lesson.id,
            type: 'lesson' as const,
            title: lesson.title,
            content: `Aula do módulo: ${lesson.course_modules?.title}`,
            created_at: lesson.created_at,
            url: `/dashboard/courses/lesson/${lesson.id}`
          })));
        }

        // Sort by relevance and date
        return results.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        ).slice(0, 20);

      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    enabled: !!user && query.length >= 2 && !!currentCompanyId,
  });
};