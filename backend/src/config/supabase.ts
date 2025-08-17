import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface DevlogEntry {
  id: string;
  project_id: string;
  title: string;
  content: string;
  entry_type: 'progress' | 'milestone' | 'bug_fix' | 'feature' | 'thoughts';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string | null;
  devlog_entry_id: string | null;
  media_type: 'image' | 'video' | 'gif';
  url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}