'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trash2, Plus, FolderPlus, FilePlus, BookOpen, ChevronDown, ChevronRight, Clock, Tag, Edit2, X, Save, LogOut } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthFetch } from '@/hooks/useAuthFetch'

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

interface DevlogEntry {
  id: string
  project_id: string
  title: string
  content: string
  entry_type: 'progress' | 'milestone' | 'bug_fix' | 'feature' | 'thoughts'
  tags: string[]
  created_at: string
  updated_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

function AdminPageContent() {
  const { signOut } = useAuth()
  const { authFetch } = useAuthFetch()
  const [folders, setFolders] = useState<Folder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [devlogEntries, setDevlogEntries] = useState<Record<string, DevlogEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'folders' | 'projects' | 'devlog'>('folders')
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editingDevlog, setEditingDevlog] = useState<string | null>(null)

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
  const [newDevlogEntry, setNewDevlogEntry] = useState({
    project_id: '',
    title: '',
    content: '',
    entry_type: 'progress' as const,
    tags: ''
  })
  
  // Edit form states
  const [editFolderData, setEditFolderData] = useState<Partial<Folder>>({})
  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({})
  const [editDevlogData, setEditDevlogData] = useState<Partial<DevlogEntry>>({})

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [foldersRes, projectsRes] = await Promise.all([
        authFetch(`${API_URL}/folders`),
        authFetch(`${API_URL}/projects`)
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

  // Fetch devlog entries for a project
  const fetchProjectDevlog = async (projectId: string) => {
    try {
      const res = await authFetch(`${API_URL}/devlog/project/${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch devlog entries')
      const entries = await res.json()
      setDevlogEntries(prev => ({ ...prev, [projectId]: entries }))
    } catch (err) {
      console.error('Error fetching devlog:', err)
    }
  }

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
      // Fetch devlog entries if not already loaded
      if (!devlogEntries[projectId]) {
        fetchProjectDevlog(projectId)
      }
    }
    setExpandedProjects(newExpanded)
  }

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await authFetch(`${API_URL}/folders`, {
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
      const res = await authFetch(`${API_URL}/projects`, {
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

  // Create devlog entry
  const handleCreateDevlogEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDevlogEntry.project_id) {
      setError('Please select a project')
      return
    }
    
    try {
      const res = await authFetch(`${API_URL}/devlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDevlogEntry,
          tags: newDevlogEntry.tags ? newDevlogEntry.tags.split(',').map(s => s.trim()) : []
        })
      })
      
      if (!res.ok) throw new Error('Failed to create devlog entry')
      
      // Refresh devlog for this project
      await fetchProjectDevlog(newDevlogEntry.project_id)
      
      // Clear form but keep project selected for convenience
      setNewDevlogEntry(prev => ({
        project_id: prev.project_id,
        title: '',
        content: '',
        entry_type: 'progress',
        tags: ''
      }))
      
      // Expand the project to show the new entry
      setExpandedProjects(prev => new Set(prev).add(newDevlogEntry.project_id))
      
      // Switch to devlog tab
      setActiveTab('devlog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create devlog entry')
    }
  }

  // Update folder
  const handleUpdateFolder = async (id: string) => {
    try {
      const res = await authFetch(`${API_URL}/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFolderData,
          parent_id: editFolderData.parent_id || null,
          display_order: Number(editFolderData.display_order)
        })
      })
      
      if (!res.ok) throw new Error('Failed to update folder')
      
      await fetchData()
      setEditingFolder(null)
      setEditFolderData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update folder')
    }
  }
  
  // Update project
  const handleUpdateProject = async (id: string) => {
    try {
      const techStack = typeof editProjectData.tech_stack === 'string' 
        ? editProjectData.tech_stack.split(',').map(s => s.trim())
        : editProjectData.tech_stack
        
      const res = await authFetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editProjectData,
          folder_id: editProjectData.folder_id || null,
          tech_stack: techStack,
          display_order: Number(editProjectData.display_order)
        })
      })
      
      if (!res.ok) throw new Error('Failed to update project')
      
      await fetchData()
      setEditingProject(null)
      setEditProjectData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    }
  }
  
  // Update devlog entry
  const handleUpdateDevlog = async (id: string) => {
    try {
      const tags = typeof editDevlogData.tags === 'string'
        ? editDevlogData.tags.split(',').map(s => s.trim())
        : editDevlogData.tags
        
      const res = await authFetch(`${API_URL}/devlog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editDevlogData,
          tags: tags
        })
      })
      
      if (!res.ok) throw new Error('Failed to update devlog entry')
      
      // Refresh devlog for the affected project
      const projectId = Object.keys(devlogEntries).find(pid => 
        devlogEntries[pid].some(e => e.id === id)
      )
      if (projectId) {
        await fetchProjectDevlog(projectId)
      }
      
      setEditingDevlog(null)
      setEditDevlogData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update devlog entry')
    }
  }
  
  // Delete folder
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? This will delete the folder.')) return
    
    try {
      const res = await authFetch(`${API_URL}/folders/${id}`, {
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
      const res = await authFetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete project')
      
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  // Delete devlog entry
  const handleDeleteDevlogEntry = async (entryId: string, projectId: string) => {
    if (!confirm('Are you sure? This will delete the devlog entry.')) return
    
    try {
      const res = await authFetch(`${API_URL}/devlog/${entryId}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete devlog entry')
      
      // Refresh devlog for this project
      await fetchProjectDevlog(projectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete devlog entry')
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
            <div className="flex items-center justify-between">
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
                  <p className="text-red-200 text-sm -mt-0.5">manage projects, folders & devlog</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
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
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-muted">
          <button
            onClick={() => setActiveTab('folders')}
            className={`pb-2 px-1 ${activeTab === 'folders' ? 'border-b-2 border-foreground' : 'text-muted-foreground'}`}
          >
            Folders
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-2 px-1 ${activeTab === 'projects' ? 'border-b-2 border-foreground' : 'text-muted-foreground'}`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('devlog')}
            className={`pb-2 px-1 ${activeTab === 'devlog' ? 'border-b-2 border-foreground' : 'text-muted-foreground'}`}
          >
            Devlog
          </button>
          <Link
            href="/admin/tweets"
            className="pb-2 px-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Tweets →
          </Link>
        </div>

        {/* Folders Tab */}
        {activeTab === 'folders' && (
          <>
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

            {/* Existing Folders */}
            <section className="mb-12">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">EXISTING FOLDERS</h2>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : folders.length > 0 ? (
                <div className="space-y-2">
                  {folders.map(folder => (
                    <div key={folder.id} className="bg-muted/10 px-4 py-2 rounded">
                      {editingFolder === folder.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editFolderData.name || ''}
                              onChange={(e) => setEditFolderData({ ...editFolderData, name: e.target.value })}
                              className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={editFolderData.slug || ''}
                              onChange={(e) => setEditFolderData({ ...editFolderData, slug: e.target.value })}
                              className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              placeholder="Slug"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={editFolderData.parent_id || ''}
                              onChange={(e) => setEditFolderData({ ...editFolderData, parent_id: e.target.value })}
                              className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                            >
                              <option value="">None (Root Level)</option>
                              {folders.filter(f => f.id !== folder.id).map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={editFolderData.display_order || 0}
                              onChange={(e) => setEditFolderData({ ...editFolderData, display_order: parseInt(e.target.value) || 0 })}
                              className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              placeholder="Order"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateFolder(folder.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              <Save className="w-3 h-3 inline mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingFolder(null)
                                setEditFolderData({})
                              }}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                            >
                              <X className="w-3 h-3 inline mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold">{folder.name}</span>
                            <span className="text-muted-foreground text-sm ml-2">/{folder.slug}</span>
                            {folder.parent_id && (
                              <span className="text-muted-foreground text-xs ml-2">
                                (parent: {folders.find(f => f.id === folder.parent_id)?.name})
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingFolder(folder.id)
                                setEditFolderData(folder)
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No folders yet</p>
              )}
            </section>
          </>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
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
                      <div key={project.id} className="bg-muted/10 px-4 py-2 rounded">
                        {editingProject === project.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={editProjectData.name || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={editProjectData.slug || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, slug: e.target.value })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                placeholder="Slug"
                              />
                            </div>
                            <textarea
                              value={editProjectData.description || ''}
                              onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
                              className="w-full px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              rows={2}
                              placeholder="Description"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={editProjectData.folder_id || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, folder_id: e.target.value })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              >
                                <option value="">None (Root)</option>
                                {folders.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                              <select
                                value={editProjectData.status || 'active'}
                                onChange={(e) => setEditProjectData({ ...editProjectData, status: e.target.value as any })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                                <option value="archived">Archived</option>
                              </select>
                              <input
                                type="number"
                                value={editProjectData.display_order || 0}
                                onChange={(e) => setEditProjectData({ ...editProjectData, display_order: parseInt(e.target.value) || 0 })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                placeholder="Order"
                              />
                            </div>
                            <input
                              type="text"
                              value={typeof editProjectData.tech_stack === 'string' ? editProjectData.tech_stack : editProjectData.tech_stack?.join(', ') || ''}
                              onChange={(e) => setEditProjectData({ ...editProjectData, tech_stack: e.target.value as any })}
                              className="w-full px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                              placeholder="Tech Stack (comma separated)"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="url"
                                value={editProjectData.github_url || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, github_url: e.target.value })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                placeholder="GitHub URL"
                              />
                              <input
                                type="url"
                                value={editProjectData.demo_url || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, demo_url: e.target.value })}
                                className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                placeholder="Demo URL"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateProject(project.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                              >
                                <Save className="w-3 h-3 inline mr-1" />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProject(null)
                                  setEditProjectData({})
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                              >
                                <X className="w-3 h-3 inline mr-1" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
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
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingProject(project.id)
                                  setEditProjectData(project)
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No projects yet</p>
              )}
            </section>
          </>
        )}

        {/* Devlog Tab */}
        {activeTab === 'devlog' && (
          <>
            {/* Create Devlog Entry Section */}
            <section className="mb-12">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                CREATE DEVLOG ENTRY
              </h2>
              <form onSubmit={handleCreateDevlogEntry} className="space-y-4 bg-muted/20 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Project *</label>
                    <select
                      value={newDevlogEntry.project_id}
                      onChange={(e) => setNewDevlogEntry({ ...newDevlogEntry, project_id: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => {
                        const folder = folders.find(f => f.id === project.folder_id)
                        return (
                          <option key={project.id} value={project.id}>
                            {folder ? `${folder.name}/` : ''}{project.name}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Entry Type</label>
                    <select
                      value={newDevlogEntry.entry_type}
                      onChange={(e) => setNewDevlogEntry({ ...newDevlogEntry, entry_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                    >
                      <option value="progress">Progress</option>
                      <option value="milestone">Milestone</option>
                      <option value="feature">Feature</option>
                      <option value="bug_fix">Bug Fix</option>
                      <option value="thoughts">Thoughts</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Title *</label>
                  <input
                    type="text"
                    value={newDevlogEntry.title}
                    onChange={(e) => setNewDevlogEntry({ ...newDevlogEntry, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                    placeholder="What did you work on?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Content *</label>
                  <textarea
                    value={newDevlogEntry.content}
                    onChange={(e) => setNewDevlogEntry({ ...newDevlogEntry, content: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                    rows={6}
                    placeholder="Describe what you did, challenges faced, solutions found..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newDevlogEntry.tags}
                    onChange={(e) => setNewDevlogEntry({ ...newDevlogEntry, tags: e.target.value })}
                    placeholder="frontend, api, bugfix, performance"
                    className="w-full px-3 py-2 bg-background border border-muted rounded font-mono text-sm"
                  />
                </div>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  Add Devlog Entry
                </button>
              </form>
            </section>

            {/* Devlog Entries by Project */}
            <section className="mb-12">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">DEVLOG ENTRIES BY PROJECT</h2>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map(project => {
                    const folder = folders.find(f => f.id === project.folder_id)
                    const isExpanded = expandedProjects.has(project.id)
                    const entries = devlogEntries[project.id] || []
                    
                    return (
                      <div key={project.id} className="bg-muted/10 rounded overflow-hidden">
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-bold">{project.name}</span>
                            <span className="text-muted-foreground text-sm">
                              /{folder ? `${folder.slug}/` : ''}{project.slug}
                            </span>
                            {isExpanded && entries.length > 0 && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                              </span>
                            )}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            {entries.length > 0 ? (
                              <div className="space-y-3 mt-3">
                                {entries.map(entry => (
                                  <div key={entry.id} className="bg-background/50 p-3 rounded border border-muted">
                                    {editingDevlog === entry.id ? (
                                      <div className="space-y-3">
                                        <input
                                          type="text"
                                          value={editDevlogData.title || ''}
                                          onChange={(e) => setEditDevlogData({ ...editDevlogData, title: e.target.value })}
                                          className="w-full px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                          placeholder="Title"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <select
                                            value={editDevlogData.entry_type || 'progress'}
                                            onChange={(e) => setEditDevlogData({ ...editDevlogData, entry_type: e.target.value as any })}
                                            className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                          >
                                            <option value="progress">Progress</option>
                                            <option value="milestone">Milestone</option>
                                            <option value="feature">Feature</option>
                                            <option value="bug_fix">Bug Fix</option>
                                            <option value="thoughts">Thoughts</option>
                                          </select>
                                          <input
                                            type="text"
                                            value={typeof editDevlogData.tags === 'string' ? editDevlogData.tags : editDevlogData.tags?.join(', ') || ''}
                                            onChange={(e) => setEditDevlogData({ ...editDevlogData, tags: e.target.value as any })}
                                            className="px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                            placeholder="Tags (comma separated)"
                                          />
                                        </div>
                                        <textarea
                                          value={editDevlogData.content || ''}
                                          onChange={(e) => setEditDevlogData({ ...editDevlogData, content: e.target.value })}
                                          className="w-full px-2 py-1 bg-background border border-muted rounded font-mono text-sm"
                                          rows={4}
                                          placeholder="Content"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleUpdateDevlog(entry.id)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                          >
                                            <Save className="w-3 h-3 inline mr-1" />
                                            Save
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingDevlog(null)
                                              setEditDevlogData({})
                                            }}
                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                                          >
                                            <X className="w-3 h-3 inline mr-1" />
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold">{entry.title}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                              entry.entry_type === 'milestone' ? 'bg-blue-900/50 text-blue-300' :
                                              entry.entry_type === 'feature' ? 'bg-green-900/50 text-green-300' :
                                              entry.entry_type === 'bug_fix' ? 'bg-red-900/50 text-red-300' :
                                              entry.entry_type === 'thoughts' ? 'bg-purple-900/50 text-purple-300' :
                                              'bg-gray-900/50 text-gray-300'
                                            }`}>
                                              {entry.entry_type.replace('_', ' ')}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                            <span className="flex items-center gap-1" suppressHydrationWarning>
                                              <Clock className="w-3 h-3" />
                                              {new Date(entry.created_at).toLocaleDateString()}
                                            </span>
                                            {entry.tags && entry.tags.length > 0 && (
                                              <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                {entry.tags.join(', ')}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground line-clamp-3">
                                            {entry.content}
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              setEditingDevlog(entry.id)
                                              setEditDevlogData(entry)
                                            }}
                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteDevlogEntry(entry.id, project.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground italic mt-3">No devlog entries yet for this project</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No projects yet. Create a project first to add devlog entries.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPageContent />
    </AuthGuard>
  )
}