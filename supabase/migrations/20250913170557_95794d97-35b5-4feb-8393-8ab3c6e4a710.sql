-- Add columns to hide comments and likes in posts table
ALTER TABLE public.posts 
ADD COLUMN hide_comments boolean NOT NULL DEFAULT false,
ADD COLUMN hide_likes boolean NOT NULL DEFAULT false;