-- Run this in the Supabase SQL Editor to persist the "Release Date" field on music videos.
-- The admin "Add Music Video" form has always collected this value, but there was no
-- column to store it, so every entry was silently discarded on save.

ALTER TABLE public.music_videos
  ADD COLUMN IF NOT EXISTS release_date DATE;

COMMENT ON COLUMN public.music_videos.release_date IS 'Optional public release date of the music video';
