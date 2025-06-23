-- Create table for Berlin news articles
CREATE TABLE public.berlin_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  borough TEXT,
  category TEXT
);

-- Enable RLS for berlin_news table
ALTER TABLE public.berlin_news ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read news
CREATE POLICY "Public can read news"
  ON public.berlin_news
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert news
CREATE POLICY "Authenticated users can insert news"
  ON public.berlin_news
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update news
CREATE POLICY "Authenticated users can update news"
  ON public.berlin_news
  FOR UPDATE
  TO authenticated
  USING (true);
