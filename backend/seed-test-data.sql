-- Insert test project: Personal Website
INSERT INTO projects (
  name,
  slug,
  description,
  folder_id,
  status,
  tech_stack,
  github_url,
  demo_url,
  display_order
) VALUES (
  'Personal Website',
  'personal-website',
  'A modern personal website and developer blog built with Next.js and Supabase. Features a hierarchical project structure, development logs, and a clean minimalist design.',
  NULL, -- No folder, root level project
  'active',
  ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Express'],
  'https://github.com/maxim/personal_website',
  'https://maximkabaev.com',
  1
) RETURNING id;

-- Store the project ID for devlog entries (using a CTE)
WITH inserted_project AS (
  SELECT id FROM projects WHERE slug = 'personal-website' LIMIT 1
)
-- Insert devlog entries for the project
INSERT INTO devlog_entries (project_id, title, content, entry_type, tags)
SELECT 
  inserted_project.id,
  title,
  content,
  entry_type,
  tags
FROM inserted_project,
(VALUES
  (
    'Initial Project Setup',
    E'Set up the initial Next.js project with TypeScript and Tailwind CSS. Configured the basic folder structure and installed essential dependencies.\n\nKey decisions:\n- Using Next.js 15 with App Router\n- TypeScript for type safety\n- Tailwind CSS for styling\n- Monorepo structure with separate frontend and backend',
    'milestone'::text,
    ARRAY['setup', 'nextjs', 'typescript']
  ),
  (
    'Database Design and Supabase Integration',
    E'Designed the database schema with support for hierarchical folder structures and projects. Implemented tables for:\n- Folders (with parent-child relationships)\n- Projects (with folder associations)\n- Devlog entries (with different entry types)\n- Project media (for future use)\n\nSet up Row Level Security policies for public read access.',
    'feature'::text,
    ARRAY['database', 'supabase', 'architecture']
  ),
  (
    'Backend API Development',
    E'Created Express.js backend with TypeScript. Implemented RESTful API endpoints for:\n- Projects CRUD operations\n- Folders with tree structure support\n- Devlog entries with filtering and pagination\n\nUsed direct PostgreSQL connection with connection pooling for optimal performance.',
    'feature'::text,
    ARRAY['backend', 'api', 'express', 'postgresql']
  ),
  (
    'Frontend UI Implementation',
    E'Developed the frontend with a minimalist terminal-inspired design. Added custom header images:\n- Samurai image for landing page\n- Personal avatar integration\n- Project-specific headers\n\nImplemented responsive layouts and smooth transitions.',
    'feature'::text,
    ARRAY['frontend', 'ui', 'design']
  ),
  (
    'Project Structure Refactoring',
    E'Refactored the codebase into a proper monorepo structure:\n- /frontend - Next.js application\n- /backend - Express API server\n\nThis separation allows for better scalability and independent deployment of frontend and backend services.',
    'progress'::text,
    ARRAY['refactoring', 'architecture', 'monorepo']
  )
) AS entries(title, content, entry_type, tags);

-- Add a sample folder for future organization
INSERT INTO folders (name, slug, parent_id, display_order)
VALUES 
  ('Web Applications', 'web-apps', NULL, 1),
  ('API Services', 'api', NULL, 2),
  ('Tools & Utilities', 'tools', NULL, 3);

-- Output confirmation
SELECT 
  'Created project: ' || name || ' (ID: ' || id || ')' as result
FROM projects 
WHERE slug = 'personal-website';

SELECT 
  'Created ' || COUNT(*) || ' devlog entries' as result
FROM devlog_entries
WHERE project_id = (SELECT id FROM projects WHERE slug = 'personal-website');

SELECT 
  'Created ' || COUNT(*) || ' folders' as result
FROM folders;