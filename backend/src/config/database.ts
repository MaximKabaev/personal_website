import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL or use individual env vars
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

// Create a connection pool optimized for Supabase pooler
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Optimized settings for Supabase pooler
  max: 10, // Reduced max connections to avoid pooler limits
  idleTimeoutMillis: 10000, // Close idle connections faster (10 seconds)
  connectionTimeoutMillis: 5000, // Give more time for initial connection
  // Additional settings for stability
  statement_timeout: 60000, // 60 second statement timeout
  query_timeout: 60000, // 60 second query timeout
  keepAlive: true, // Enable TCP keepalive
  keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Handle pool errors more gracefully - don't exit the process
pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Unexpected error on idle client:', err.message);
  // Don't exit - the pool will automatically create new connections as needed
  // This prevents the app from crashing when Supabase pooler terminates idle connections
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

// Helper function for queries with automatic retry
export async function query<T = any>(text: string, params?: any[], retries = 3): Promise<T[]> {
  const start = Date.now();
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
      return res.rows;
    } catch (error: any) {
      lastError = error;
      console.error(`Database query error (attempt ${i + 1}/${retries}):`, error.message);
      
      // If it's a connection error and we have retries left, wait before retrying
      if (i < retries - 1 && (error.code === 'ECONNRESET' || error.code === 'XX000' || error.code === 'ETIMEDOUT')) {
        console.log(`Retrying query in ${(i + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
}

// Helper function for single row queries
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}