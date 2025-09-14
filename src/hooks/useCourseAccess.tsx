import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useCourses } from './useCourses';
import { useUserCourseProgress } from './useUserCourseProgress';

export const useCourseAccess = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: courses = [] } = useCourses();

  return useQuery({
    queryKey: ['course-access', user?.id, currentCompanyId, courses.length],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !courses.length) {
        return {};
      }

      console.log('🔒 Checking course access with prerequisite system');
      
      const accessMap: Record<string, boolean> = {};

      for (const course of courses) {
        console.log(`🎯 Checking access for course: ${course.title}`);
        
        // Use the new RPC function that handles prerequisites
        const { data: hasAccess } = await supabase.rpc('user_has_course_access', {
          p_user_id: user.id,
          p_course_id: course.id
        });
        
        accessMap[course.id] = hasAccess || false;
        console.log(`${hasAccess ? '✅' : '🔒'} Course "${course.title}": ${hasAccess ? 'accessible' : 'locked'}`);
      }

      return accessMap;
    },
    enabled: !!user?.id && !!currentCompanyId && !!courses.length,
  });
};

export const useModuleAccess = (courseId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: allUserProgress = [] } = useUserCourseProgress(courseId);

  return useQuery({
    queryKey: ['module-access', courseId, user?.id, currentCompanyId, allUserProgress.length],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !courseId) {
        return {};
      }

      console.log('🔒 Checking module access for course:', courseId);

      // Get course details to check linear progression setting
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('linear_module_progression')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        return {};
      }

      const isLinearProgression = course?.linear_module_progression || false;
      console.log('📈 Linear progression enabled:', isLinearProgression);
      
      // Get all modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError || !modules) {
        console.error('Error fetching modules:', modulesError);
        return {};
      }

      const accessMap: Record<string, boolean> = {};
      
      if (!isLinearProgression) {
        // If progression is free, all modules are accessible
        console.log('🆓 Free progression - all modules accessible');
        modules.forEach(module => {
          accessMap[module.id] = true;
        });
        return accessMap;
      }

      // For linear progression, check completion status of previous modules
      console.log('🔐 Linear progression - checking completions');
      
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        
        if (i === 0) {
          // First module is always accessible
          accessMap[module.id] = true;
          console.log(`✅ Module ${i + 1} (${module.id}): accessible (first module)`);
        } else {
          // Check if previous module is completed
          const previousModule = modules[i - 1];
          const isPreviousCompleted = await checkModuleCompletion(previousModule.id, user.id);
          accessMap[module.id] = isPreviousCompleted;
          console.log(`${isPreviousCompleted ? '✅' : '🔒'} Module ${i + 1} (${module.id}): ${isPreviousCompleted ? 'accessible' : 'locked'} (previous completed: ${isPreviousCompleted})`);
        }
      }

      return accessMap;
    },
    enabled: !!user?.id && !!currentCompanyId && !!courseId,
  });
};

// Helper function to check if a course is completed
const checkCourseCompletion = async (courseId: string, userId: string): Promise<boolean> => {
  const { data: isCompleted } = await supabase
    .rpc('check_course_completion', {
      p_user_id: userId,
      p_course_id: courseId
    });
  
  return isCompleted || false;
};

// Helper function to check if a module is completed
const checkModuleCompletion = async (moduleId: string, userId: string): Promise<boolean> => {
  const { data: isCompleted } = await supabase
    .rpc('check_module_completion', {
      p_user_id: userId,
      p_module_id: moduleId
    });
  
  return isCompleted || false;
};