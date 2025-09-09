-- Add missing linear_module_progression column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS linear_module_progression boolean NOT NULL DEFAULT false;

-- Add index for better performance on this column
CREATE INDEX IF NOT EXISTS idx_courses_linear_module_progression 
ON public.courses(linear_module_progression);

-- Update the courses table comment
COMMENT ON COLUMN public.courses.linear_module_progression IS 'Controls whether users must complete modules in sequential order within this course';