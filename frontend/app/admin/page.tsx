'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trash2, Plus, FolderPlus, FilePlus } from 'lucide-react'

interface Folder {
  id: string
  name: string
  slug: string
  parent_id: string | null
  display_order: number
}

interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  folder_id: string | null
  status: 'active' | 'completed' | 'archived' | 'paused'
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  display_order: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function AdminPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newFolder, setNewFolder] = useState({ name: '', slug: '', parent_id: '', display_order: 0 })
  const [newProject, setNewProject] = useState({
    name: '',
    slug: '',
    description: '',
    folder_id: '',
    status: 'active' as const,
    tech_stack: '',
    github_url: '',
    demo_url: '',
    display_order: 0
  })

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [foldersRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/folders`),
        fetch(`${API_URL}/projects`)
      ])
      
      if (!foldersRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const [foldersData, projectsData] = await Promise.all([
        foldersRes.json(),
        projectsRes.json()
      ])
      
      setFolders(foldersData)
      setProjects(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFolder,
          parent_id: newFolder.parent_id || null,
          display_order: Number(newFolder.display_order)
        })
      })
      
      if (!res.ok) throw new Error('Failed to create folder')
      
      await fetchData()
      setNewFolder({ name: '', slug: '', parent_id: '', display_order: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          folder_id: newProject.folder_id || null,
          tech_stack: newProject.tech_stack ? newProject.tech_stack.split(',').map(s => s.trim()) : [],
          display_order: Number(newProject.display_order)
        })
      })
      
      if (!res.ok) throw new Error('Failed to create project')
      
      await fetchData()
      setNewProject({
        name: '',
        slug: '',
        description: '',
        folder_id: '',
        status: 'active',
        tech_stack: '',
        github_url: '',
        demo_url: '',
        display_order: 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? This will delete the folder.')) return
    
    try {
      const res = await fetch(`${API_URL}/folders/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete folder')
      
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder')
    }
  }

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure? This will delete the project and all its devlog entries.')) return
    
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete project')
      
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  // Auto-generate slug
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900 via-red-800 to-red-900"></div>
          <div className="relative z-10 py-8 px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500">
                <Image
                  src="/profile-avatar.jpg"
                  alt="Admin"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-0">ADMIN PANEL</h1>
                <p className="text-red-200 text-sm -mt-0.5">manage projects & folders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to home
        </Link>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2 rounded mb-6">
            {error}
          </div>
        )}

        {/* Create Folder Section */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wide flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            CREATE FOLDER
          </h2>
          <form onSubmit={handleCreateFolder} className="space-y-4 bg-muted/20 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) => {
                    setNewFolder({ 
                      ...newFolder, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })
                  }}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Slug</label>
                <input
                  type="text"
                  value={newFolder.slug}
                  onChange={(e) => setNewFolder({ ...newFolder, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Parent Folder (optional)</label>
                <select
                  value={newFolder.parent_id}
                  onChange={(e) => setNewFolder({ ...newFolder, parent_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                >
                  <option value="">None (Root Level)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Display Order</label>
                <input
                  type="number"
                  value={newFolder.display_order}
                  onChange={(e) => setNewFolder({ ...newFolder, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Create Folder
            </button>
          </form>
        </section>

        {/* Create Project Section */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wide flex items-center gap-2">
            <FilePlus className="w-5 h-5" />
            CREATE PROJECT
          </h2>
          <form onSubmit={handleCreateProject} className="space-y-4 bg-muted/20 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => {
                    setNewProject({ 
                      ...newProject, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })
                  }}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Slug</label>
                <input
                  type="text"
                  value={newProject.slug}
                  onChange={(e) => setNewProject({ ...newProject, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Folder (optional)</label>
                <select
                  value={newProject.folder_id}
                  onChange={(e) => setNewProject({ ...newProject, folder_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                >
                  <option value="">None (Root Level)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Status</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Display Order</label>
                <input
                  type="number"
                  value={newProject.display_order}
                  onChange={(e) => setNewProject({ ...newProject, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Tech Stack (comma separated)</label>
              <input
                type="text"
                value={newProject.tech_stack}
                onChange={(e) => setNewProject({ ...newProject, tech_stack: e.target.value })}
                placeholder="React, TypeScript, Tailwind CSS"
                className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">GitHub URL (optional)</label>
                <input
                  type="url"
                  value={newProject.github_url}
                  onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Demo URL (optional)</label>
                <input
                  type="url"
                  value={newProject.demo_url}
                  onChange={(e) => setNewProject({ ...newProject, demo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Create Project
            </button>
          </form>
        </section>

        {/* Existing Folders */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">EXISTING FOLDERS</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : folders.length > 0 ? (
            <div className="space-y-2">
              {folders.map(folder => (
                <div key={folder.id} className="flex items-center justify-between bg-muted/10 px-4 py-2 rounded">
                  <div>
                    <span className="font-bold">{folder.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">/{folder.slug}</span>
                    {folder.parent_id && (
                      <span className="text-muted-foreground text-xs ml-2">
                        (parent: {folders.find(f => f.id === folder.parent_id)?.name})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No folders yet</p>
          )}
        </section>

        {/* Existing Projects */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">EXISTING PROJECTS</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map(project => {
                const folder = folders.find(f => f.id === project.folder_id)
                return (
                  <div key={project.id} className="flex items-center justify-between bg-muted/10 px-4 py-2 rounded">
                    <div>
                      <span className="font-bold">{project.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        /{folder ? `${folder.slug}/` : ''}{project.slug}
                      </span>
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded ${
                        project.status === 'active' ? 'bg-green-900/50 text-green-300' :
                        project.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                        project.status === 'paused' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No projects yet</p>
          )}
        </section>
      </div>
    </div>
  )
}