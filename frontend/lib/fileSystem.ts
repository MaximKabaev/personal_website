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
  type: 'file' | 'directory' | 'executable'
  path: string[]
  slug?: string
  folderSlug?: string
  metadata?: Project
}

export class FileSystem {
  private root: Map<string, FileSystemNode> // Root level (/)
  private structure: Map<string, Map<string, FileSystemNode>>

  constructor(projects: Project[], folders: Folder[]) {
    this.root = new Map()
    this.structure = new Map()
    this.buildFileSystem(projects, folders)
  }

  private buildFileSystem(projects: Project[], folders: Folder[]) {
    // ROOT LEVEL (/) - Add usr directory and play.sh
    this.root.set('usr', {
      name: 'usr',
      type: 'directory',
      path: ['usr']
    })
    
    this.root.set('play.sh', {
      name: 'play.sh',
      type: 'executable',
      path: ['play.sh']
    })

    // USR LEVEL (/usr) - Add maxim directory  
    const usrDir = new Map<string, FileSystemNode>()
    usrDir.set('maxim', {
      name: 'maxim',
      type: 'directory',
      path: ['usr', 'maxim']
    })
    this.structure.set('usr', usrDir)

    // MAXIM HOME LEVEL (/usr/maxim) - Add projects and root-level projects
    const maximDir = new Map<string, FileSystemNode>()
    maximDir.set('projects', {
      name: 'projects',
      type: 'directory',
      path: ['usr', 'maxim', 'projects']
    })

    // Add root-level projects to maxim directory
    projects.filter(p => !p.folder_id).forEach(project => {
      maximDir.set(project.slug, {
        name: project.slug,
        type: 'file',
        path: ['usr', 'maxim', project.slug],
        slug: project.slug,
        metadata: project
      })
    })
    this.structure.set('usr/maxim', maximDir)

    // PROJECTS DIRECTORY (/usr/maxim/projects) - Add project folders
    const projectsDir = new Map<string, FileSystemNode>()
    
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

      this.structure.set(`usr/maxim/projects/${folder.slug}`, folderContents)
    })

    this.structure.set('usr/maxim/projects', projectsDir)
  }

  list(path: string[]): FileSystemNode[] {
    if (path.length === 0) {
      // Root directory (/)
      return Array.from(this.root.values())
    }

    // Build path string for lookup
    const pathStr = path.join('/')
    const dir = this.structure.get(pathStr)
    if (dir) {
      return Array.from(dir.values())
    }

    return []
  }

  resolvePath(currentPath: string[], targetPath: string): string[] | null {
    // Handle home directory paths (~/ means /usr/maxim)
    if (targetPath.startsWith('~/')) {
      targetPath = targetPath.slice(2) // Remove ~/
      const homePath = ['usr', 'maxim']
      if (!targetPath) {
        return homePath
      }
      // Continue with relative path from home
      currentPath = homePath
    }
    
    // Handle absolute paths
    if (targetPath.startsWith('/')) {
      const parts = targetPath.split('/').filter(Boolean)
      return this.validatePath(parts) ? parts : null
    }

    // Handle relative paths
    const parts = targetPath.split('/').filter(Boolean)
    let newPath = [...currentPath]

    for (const part of parts) {
      if (part === '.') {
        continue
      } else if (part === '..') {
        if (newPath.length > 0) { // Can go to root
          newPath.pop()
        }
      } else {
        newPath.push(part)
      }
    }

    return this.validatePath(newPath) ? newPath : null
  }

  private validatePath(path: string[]): boolean {
    // Root directory (/) is valid
    if (path.length === 0) {
      return true
    }

    // Check if it's a root-level item
    if (path.length === 1) {
      return this.root.has(path[0])
    }

    // Check if path exists in structure
    const pathStr = path.join('/')
    
    // Direct structure lookup
    if (this.structure.has(pathStr)) {
      return true
    }

    // Check if it's a file in any directory
    const parentPath = path.slice(0, -1).join('/')
    const fileName = path[path.length - 1]
    const parentDir = this.structure.get(parentPath)
    
    return parentDir?.has(fileName) || false
  }

  getNode(path: string[]): FileSystemNode | null {
    // Root directory
    if (path.length === 0) {
      return { name: '/', type: 'directory', path: [] }
    }

    // Root-level item
    if (path.length === 1) {
      return this.root.get(path[0]) || null
    }

    // Check structure directories
    const pathStr = path.join('/')
    if (this.structure.has(pathStr)) {
      const dirName = path[path.length - 1]
      return { name: dirName, type: 'directory', path }
    }

    // Check for file in directory
    const parentPath = path.slice(0, -1).join('/')
    const fileName = path[path.length - 1]
    const parentDir = this.structure.get(parentPath)
    
    return parentDir?.get(fileName) || null
  }

  isFile(path: string[]): boolean {
    const node = this.getNode(path)
    return node?.type === 'file' || node?.type === 'executable' || false
  }

  isExecutable(path: string[]): boolean {
    const node = this.getNode(path)
    return node?.type === 'executable' || false
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