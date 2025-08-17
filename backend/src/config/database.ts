import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual env vars
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Create a connection pool for better performance
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database types
export interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  folder_id: string | null;
  status: 'active' | 'completed' | 'archived' | 'paused';
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface DevlogEntry {
  id: string;
  project_id: string;
  title: string;
  content: string;
  entry_type: 'progress' | 'milestone' | 'bug_fix' | 'feature' | 'thoughts';
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ProjectMedia {
  id: string;
  project_id: string | null;
  devlog_entry_id: string | null;
  media_type: 'image' | 'video' | 'gif';
  url: string;
  caption: string | null;
  display_order: number;
  created_at: Date;
}

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function for single row queries
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}