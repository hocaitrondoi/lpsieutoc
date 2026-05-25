-- Add current_session_id column to profiles table to store the active session token
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_session_id TEXT;
