-- Add slug and permissions columns to space_categories table
ALTER TABLE public.space_categories 
ADD COLUMN slug text UNIQUE,
ADD COLUMN permissions jsonb DEFAULT '{
  "can_create_spaces": false,
  "can_manage_members": false,
  "can_moderate_content": false,
  "can_view_analytics": false
}'::jsonb;