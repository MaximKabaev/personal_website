const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
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

export interface DevlogImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploaded_at: string;
  alt_text?: string;
}

export interface DevlogEntry {
  id: string;
  project_id: string;
  title: string;
  content: string;
  entry_type: 'progress' | 'milestone' | 'bug_fix' | 'feature' | 'thoughts';
  tags: string[];
  images?: DevlogImage[];
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    slug: string;
    folder_id?: string;
  };
}

// Projects API
export async function getProjects(folderId?: string, status?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (folderId) params.append('folder_id', folderId);
  if (status) params.append('status', status);
  
  const res = await fetch(`${API_URL}/projects?${params}`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function getProject(identifier: string): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${identifier}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function getProjectByPath(folderSlug: string, projectSlug: string): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/by-path/${folderSlug}/${projectSlug}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

// Folders API
export async function getFolders(parentId?: string | null): Promise<Folder[]> {
  const params = new URLSearchParams();
  if (parentId !== undefined) params.append('parent_id', parentId || 'null');
  
  const res = await fetch(`${API_URL}/folders?${params}`);
  if (!res.ok) throw new Error('Failed to fetch folders');
  return res.json();
}

export async function getFolderTree(): Promise<Folder[]> {
  const res = await fetch(`${API_URL}/folders/tree`);
  if (!res.ok) throw new Error('Failed to fetch folder tree');
  return res.json();
}

export async function getFolder(identifier: string): Promise<Folder> {
  const res = await fetch(`${API_URL}/folders/${identifier}`);
  if (!res.ok) throw new Error('Failed to fetch folder');
  return res.json();
}

// Devlog API
export async function getDevlogEntries(projectId?: string, limit = 10, offset = 0): Promise<DevlogEntry[]> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  
  const res = await fetch(`${API_URL}/devlog?${params}`);
  if (!res.ok) throw new Error('Failed to fetch devlog entries');
  return res.json();
}

export async function getRecentEntries(limit = 5): Promise<DevlogEntry[]> {
  const res = await fetch(`${API_URL}/devlog/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent entries');
  return res.json();
}

export async function getProjectDevlog(projectId: string, limit = 20, offset = 0): Promise<DevlogEntry[]> {
  const res = await fetch(`${API_URL}/devlog/project/${projectId}?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('Failed to fetch project devlog');
  return res.json();
}

export async function getDevlogEntry(id: string): Promise<DevlogEntry> {
  const res = await fetch(`${API_URL}/devlog/${id}`);
  if (!res.ok) throw new Error('Failed to fetch devlog entry');
  return res.json();
}