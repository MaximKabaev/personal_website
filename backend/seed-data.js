const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedData() {
  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'seed-test-data.sql'), 'utf8');
    
    // Split by semicolons but be careful with the VALUES content
    const statements = sqlFile
      .split(/;\s*$|;\s*\n/m)
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
    
    // First, let's insert the project
    const projectResult = await pool.query(`
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
        NULL,
        'active',
        ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Express'],
        'https://github.com/maxim/personal_website',
        'https://maximkabaev.com',
        1
      ) RETURNING id
    `);
    
    const projectId = projectResult.rows[0].id;
    console.log(`Created project with ID: ${projectId}`);
    
    // Insert devlog entries
    const entries = [
      {
        title: 'Initial Project Setup',
        content: `Set up the initial Next.js project with TypeScript and Tailwind CSS. Configured the basic folder structure and installed essential dependencies.

Key decisions:
- Using Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Monorepo structure with separate frontend and backend`,
        entry_type: 'milestone',
        tags: ['setup', 'nextjs', 'typescript']
      },
      {
        title: 'Database Design and Supabase Integration',
        content: `Designed the database schema with support for hierarchical folder structures and projects. Implemented tables for:
- Folders (with parent-child relationships)
- Projects (with folder associations)
- Devlog entries (with different entry types)
- Project media (for future use)

Set up Row Level Security policies for public read access.`,
        entry_type: 'feature',
        tags: ['database', 'supabase', 'architecture']
      },
      {
        title: 'Backend API Development',
        content: `Created Express.js backend with TypeScript. Implemented RESTful API endpoints for:
- Projects CRUD operations
- Folders with tree structure support
- Devlog entries with filtering and pagination

Used direct PostgreSQL connection with connection pooling for optimal performance.`,
        entry_type: 'feature',
        tags: ['backend', 'api', 'express', 'postgresql']
      },
      {
        title: 'Frontend UI Implementation',
        content: `Developed the frontend with a minimalist terminal-inspired design. Added custom header images:
- Samurai image for landing page
- Personal avatar integration
- Project-specific headers

Implemented responsive layouts and smooth transitions.`,
        entry_type: 'feature',
        tags: ['frontend', 'ui', 'design']
      },
      {
        title: 'Project Structure Refactoring',
        content: `Refactored the codebase into a proper monorepo structure:
- /frontend - Next.js application
- /backend - Express API server

This separation allows for better scalability and independent deployment of frontend and backend services.`,
        entry_type: 'progress',
        tags: ['refactoring', 'architecture', 'monorepo']
      }
    ];
    
    for (const entry of entries) {
      await pool.query(
        `INSERT INTO devlog_entries (project_id, title, content, entry_type, tags)
         VALUES ($1, $2, $3, $4, $5)`,
        [projectId, entry.title, entry.content, entry.entry_type, entry.tags]
      );
      console.log(`Created devlog entry: ${entry.title}`);
    }
    
    // Insert folders
    const folders = [
      { name: 'Web Applications', slug: 'web-apps', parent_id: null, display_order: 1 },
      { name: 'API Services', slug: 'api', parent_id: null, display_order: 2 },
      { name: 'Tools & Utilities', slug: 'tools', parent_id: null, display_order: 3 }
    ];
    
    for (const folder of folders) {
      await pool.query(
        `INSERT INTO folders (name, slug, parent_id, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [folder.name, folder.slug, folder.parent_id, folder.display_order]
      );
      console.log(`Created folder: ${folder.name}`);
    }
    
    console.log('\n✅ Test data seeded successfully!');
    console.log('You can now visit http://localhost:3000 to see your personal website project.');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seedData();