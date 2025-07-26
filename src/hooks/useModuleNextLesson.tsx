import { useQuery } from '@tanstack/react-query';
import { useCourseLessons } from './useCourseLessons';
import { useUserCourseProgress } from './useUserCourseProgress';

export const useModuleNextLesson = (moduleId: string, courseId: string) => {
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(moduleId);
  const { data: progress, isLoading: progressLoading } = useUserCourseProgress(courseId);

  return useQuery({
    queryKey: ['module-next-lesson', moduleId, courseId],
    queryFn: () => {
      if (!lessons || lessons.length === 0) {
        return null;
      }

      // Sort lessons by order_index to ensure correct order
      const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
      
      // Find completed lessons for this module
      const completedLessons = progress?.filter(p => 
        sortedLessons.some(lesson => lesson.id === p.lesson_id) && p.completed_at
      ) || [];

      // If no progress, return first lesson
      if (completedLessons.length === 0) {
        return sortedLessons[0];
      }

      // Find first uncompleted lesson
      const nextLesson = sortedLessons.find(lesson => 
        !completedLessons.some(completed => completed.lesson_id === lesson.id)
      );

      // If all lessons completed, return last lesson
      return nextLesson || sortedLessons[sortedLessons.length - 1];
    },
    enabled: !!moduleId && !!courseId && !lessonsLoading && !progressLoading && !!lessons
  });
};