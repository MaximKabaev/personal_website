import { projects, type Project, type DevlogEntry } from "./data"

export interface ProjectWithEntries extends Project {
  entries: DevlogEntry[]
}

export interface DevlogEntryWithProject extends DevlogEntry {
  project: {
    id: string
    name: string
  }
}

export async function getProjects(): Promise<Project[]> {
  // Convert data structure to match expected format
  return projects.map((project) => ({
    id: project.id,
    name: project.title,
    description: project.description,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

export async function getProject(id: string): Promise<Project | null> {
  const project = projects.find((p) => p.id === id)
  if (!project) return null

  return {
    id: project.id,
    name: project.title,
    description: project.description,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function getDevlogEntries(projectId: string): Promise<DevlogEntry[]> {
  const project = projects.find((p) => p.id === projectId)
  if (!project) return []

  // Convert entries to match expected format
  return project.entries.map((entry) => ({
    id: entry.id,
    project_id: projectId,
    title: entry.description,
    content: entry.details || entry.comments || "",
    timestamp: entry.timestamp,
    created_at: entry.timestamp,
  }))
}

export async function getRecentEntries(limit = 5): Promise<DevlogEntryWithProject[]> {
  const allEntries: DevlogEntryWithProject[] = []

  projects.forEach((project) => {
    project.entries.forEach((entry) => {
      allEntries.push({
        id: entry.id,
        project_id: project.id,
        title: entry.description,
        content: entry.details || entry.comments || "",
        timestamp: entry.timestamp,
        created_at: entry.timestamp,
        project: {
          id: project.id,
          name: project.title,
        },
      })
    })
  })

  // Sort by timestamp and limit
  return allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
}

export async function createProject(name: string, description?: string): Promise<Project | null> {
  // Mock implementation for API compatibility
  const newProject: Project = {
    id: `project-${Date.now()}`,
    name,
    description: description || "",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return newProject
}

export async function createDevlogEntry(
  projectId: string,
  title: string,
  content: string,
  timestamp?: string,
): Promise<DevlogEntry | null> {
  // Mock implementation for API compatibility
  const newEntry: DevlogEntry = {
    id: `entry-${Date.now()}`,
    project_id: projectId,
    title,
    content,
    timestamp: timestamp || new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  return newEntry
}
