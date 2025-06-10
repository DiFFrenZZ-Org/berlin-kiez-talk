
-- Add a super_admin role to the user_role enum
ALTER TYPE user_role ADD VALUE 'super_admin';

-- Update the profiles table to allow super_admin role
-- (This will allow super admins to have a proper role in the system)

-- Let's also add fields to the events structure for better filtering and images
-- We'll need to modify our events scraping to include more metadata
CREATE TABLE IF NOT EXISTS public.berlin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  location TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[], -- Array of tags for filtering (techno, open-air, etc.)
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for events table
ALTER TABLE public.berlin_events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read events (public data)
CREATE POLICY "Everyone can view events" 
  ON public.berlin_events 
  FOR SELECT 
  TO public 
  USING (true);

-- Only allow authenticated users to insert/update events (for scraping)
CREATE POLICY "Authenticated users can manage events" 
  ON public.berlin_events 
  FOR ALL 
  TO authenticated 
  USING (true);
