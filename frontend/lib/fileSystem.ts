type Project = {
  id: string
  name: string
  slug: string
  folder_id: string | null
  description?: string
  status?: string
  tech_stack?: string[]
  github_url?: string
  demo_url?: string
}

type Folder = {
  id: string
  name: string
  slug: string
}

export type FileSystemNode = {
  name: string
  type: 'file' | 'directory'
  path: string[]
  slug?: string
  folderSlug?: string
  metadata?: Project
}

export class FileSystem {
  private root: Map<string, FileSystemNode>
  private structure: Map<string, Map<string, FileSystemNode>>

  constructor(projects: Project[], folders: Folder[]) {
    this.root = new Map()
    this.structure = new Map()
    this.buildFileSystem(projects, folders)
  }

  private buildFileSystem(projects: Project[], folders: Folder[]) {
    // Add 'projects' as a directory at root
    this.root.set('projects', {
      name: 'projects',
      type: 'directory',
      path: ['usr', 'maxim', 'projects']
    })

    // Create projects directory structure
    const projectsDir = new Map<string, FileSystemNode>()
    
    // Add folders
    folders.forEach(folder => {
      projectsDir.set(folder.slug, {
        name: folder.slug,
        type: 'directory',
        path: ['usr', 'maxim', 'projects', folder.slug],
        slug: folder.slug
      })

      // Create folder contents
      const folderContents = new Map<string, FileSystemNode>()
      const folderProjects = projects.filter(p => p.folder_id === folder.id)
      
      folderProjects.forEach(project => {
        folderContents.set(project.slug, {
          name: project.slug,
          type: 'file',
          path: ['usr', 'maxim', 'projects', folder.slug, project.slug],
          slug: project.slug,
          folderSlug: folder.slug,
          metadata: project
        })
      })

      this.structure.set(`projects/${folder.slug}`, folderContents)
    })

    this.structure.set('projects', projectsDir)

    // Add root-level projects
    projects.filter(p => !p.folder_id).forEach(project => {
      this.root.set(project.slug, {
        name: project.slug,
        type: 'file',
        path: ['usr', 'maxim', project.slug],
        slug: project.slug,
        metadata: project
      })
    })
  }

  list(path: string[]): FileSystemNode[] {
    const pathStr = path.slice(2).join('/') // Remove 'usr/maxim'
    
    if (path.length === 2) {
      // Root directory
      return Array.from(this.root.values())
    }

    const dir = this.structure.get(pathStr)
    if (dir) {
      return Array.from(dir.values())
    }

    return []
  }

  resolvePath(currentPath: string[], targetPath: string): string[] | null {
    // Handle home directory paths
    if (targetPath.startsWith('~/')) {
      targetPath = targetPath.slice(2) // Remove ~/
      const homePath = ['usr', 'maxim']
      if (!targetPath) {
        return homePath
      }
      // Continue with relative path from home
      currentPath = homePath
      targetPath = targetPath // Use the rest as relative path
    }
    
    // Handle absolute paths
    if (targetPath.startsWith('/')) {
      const parts = targetPath.split('/').filter(Boolean)
      if (parts[0] === 'usr' && parts[1] === 'maxim') {
        return this.validatePath(parts) ? parts : null
      }
      return null
    }

    // Handle relative paths
    const parts = targetPath.split('/').filter(Boolean)
    let newPath = [...currentPath]

    for (const part of parts) {
      if (part === '.') {
        continue
      } else if (part === '..') {
        if (newPath.length > 2) { // Don't go above /usr/maxim
          newPath.pop()
        }
      } else {
        newPath.push(part)
      }
    }

    return this.validatePath(newPath) ? newPath : null
  }

  private validatePath(path: string[]): boolean {
    if (path.length < 2 || path[0] !== 'usr' || path[1] !== 'maxim') {
      return false
    }

    if (path.length === 2) {
      return true // Root is always valid
    }

    const relativePath = path.slice(2)
    
    // Check if it's a root-level file
    if (relativePath.length === 1) {
      const node = this.root.get(relativePath[0])
      return node !== undefined
    }

    // Check if it's projects directory
    if (relativePath.length === 1 && relativePath[0] === 'projects') {
      return true
    }

    // Check if it's a folder in projects
    if (relativePath.length === 2 && relativePath[0] === 'projects') {
      const projectsDir = this.structure.get('projects')
      return projectsDir?.has(relativePath[1]) || false
    }

    // Check if it's a file in a folder
    if (relativePath.length === 3 && relativePath[0] === 'projects') {
      const folderContents = this.structure.get(`projects/${relativePath[1]}`)
      return folderContents?.has(relativePath[2]) || false
    }

    return false
  }

  getNode(path: string[]): FileSystemNode | null {
    if (path.length === 2) {
      return { name: 'maxim', type: 'directory', path }
    }

    const relativePath = path.slice(2)

    // Root-level file
    if (relativePath.length === 1 && this.root.has(relativePath[0])) {
      return this.root.get(relativePath[0]) || null
    }

    // Projects directory
    if (relativePath.length === 1 && relativePath[0] === 'projects') {
      return { name: 'projects', type: 'directory', path }
    }

    // Folder in projects
    if (relativePath.length === 2 && relativePath[0] === 'projects') {
      const projectsDir = this.structure.get('projects')
      return projectsDir?.get(relativePath[1]) || null
    }

    // File in folder
    if (relativePath.length === 3 && relativePath[0] === 'projects') {
      const folderContents = this.structure.get(`projects/${relativePath[1]}`)
      return folderContents?.get(relativePath[2]) || null
    }

    return null
  }

  isFile(path: string[]): boolean {
    const node = this.getNode(path)
    return node?.type === 'file' || false
  }

  getProjectUrl(node: FileSystemNode): string | null {
    if (node.type !== 'file') return null
    
    if (node.folderSlug && node.slug) {
      return `/projects/${node.folderSlug}/${node.slug}`
    } else if (node.slug) {
      return `/projects/${node.slug}`
    }
    
    return null
  }
}