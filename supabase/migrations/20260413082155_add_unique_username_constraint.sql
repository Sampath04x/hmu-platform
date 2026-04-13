-- Enforce UNIQUE constraint on profiles.username
ALTER TABLE public.profiles
ADD CONSTRAINT unique_username UNIQUE (username);
