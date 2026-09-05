-- Add missing fields to public.clubs for Club Profile Setup
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
