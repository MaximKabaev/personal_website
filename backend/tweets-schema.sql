-- Tweets table to store fetched tweets from X/Twitter
CREATE TABLE IF NOT EXISTS tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id VARCHAR(255) UNIQUE NOT NULL, -- Twitter's tweet ID
  text TEXT NOT NULL,
  author_username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When tweet was posted
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When we fetched it
  assigned_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  converted_to_devlog BOOLEAN DEFAULT FALSE,
  media_urls JSONB DEFAULT '[]'::jsonb, -- Array of media URLs
  metrics JSONB DEFAULT '{}'::jsonb, -- Likes, retweets, etc.
  raw_data JSONB DEFAULT '{}'::jsonb -- Store full tweet data for reference
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tweets_assigned_project ON tweets(assigned_project_id);
CREATE INDEX IF NOT EXISTS idx_tweets_converted ON tweets(converted_to_devlog);

-- RLS policies
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to tweets" 
  ON tweets FOR SELECT 
  USING (true);

-- Only allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage tweets" 
  ON tweets FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');