-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create folders table for organizing projects
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'paused')),
  tech_stack TEXT[] DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(folder_id, slug)
);

-- Create devlog_entries table
CREATE TABLE devlog_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entry_type TEXT DEFAULT 'progress' CHECK (entry_type IN ('progress', 'milestone', 'bug_fix', 'feature', 'thoughts')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create project_media table for future use
CREATE TABLE project_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  devlog_entry_id UUID REFERENCES devlog_entries(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'gif')),
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_projects_folder_id ON projects(folder_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_devlog_entries_project_id ON devlog_entries(project_id);
CREATE INDEX idx_devlog_entries_created_at ON devlog_entries(created_at DESC);
CREATE INDEX idx_project_media_project_id ON project_media(project_id);
CREATE INDEX idx_project_media_devlog_entry_id ON project_media(devlog_entry_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devlog_entries_updated_at BEFORE UPDATE ON devlog_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE devlog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public folders are viewable by everyone" ON folders
  FOR SELECT USING (true);

CREATE POLICY "Public projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Public devlog entries are viewable by everyone" ON devlog_entries
  FOR SELECT USING (true);

CREATE POLICY "Public media is viewable by everyone" ON project_media
  FOR SELECT USING (true);

-- Insert some sample data (optional - you can skip this section)
-- Sample folders
INSERT INTO folders (name, slug, parent_id, display_order) VALUES
  ('API Projects', 'api', NULL, 1),
  ('Tools', 'tools', NULL, 2),
  ('Games', 'games', NULL, 3);

-- Get the folder IDs for reference (you'll see these in Supabase dashboard)
-- Sample project
WITH api_folder AS (
  SELECT id FROM folders WHERE slug = 'api' LIMIT 1
)
INSERT INTO projects (name, slug, description, folder_id, status, tech_stack) 
SELECT 
  'Weather API',
  'weather-api',
  'A RESTful API for weather data aggregation and forecasting',
  api_folder.id,
  'active',
  ARRAY['Node.js', 'Express', 'PostgreSQL', 'Redis']
FROM api_folder;

-- Sample devlog entry
WITH weather_project AS (
  SELECT id FROM projects WHERE slug = 'weather-api' LIMIT 1
)
INSERT INTO devlog_entries (project_id, title, content, entry_type, tags)
SELECT 
  weather_project.id,
  'Initial API Setup',
  'Set up the basic Express server with TypeScript. Configured ESLint and Prettier for code consistency. Created the initial folder structure following clean architecture principles.',
  'milestone',
  ARRAY['setup', 'typescript', 'architecture']
FROM weather_project;