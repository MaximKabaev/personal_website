"use client"
import React, { useState } from "react"
import Link from "next/link"
import { ChevronRight, Folder, FileText } from "lucide-react"

type Project = {
  id: string
  name: string
  slug: string
  status: string
  folder_id: string | null
  description?: string
}

type FolderType = {
  id: string
  name: string
  slug: string
}

type Props = {
  projects: Project[]
  folders: FolderType[]
}

export default function MobileProjects({ projects, folders }: Props) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const rootProjects = projects.filter(p => !p.folder_id)

  return (
    <div className="space-y-3">
      {/* Root level projects */}
      {rootProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.slug}`}
          className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.status}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Link>
      ))}

      {/* Folders with projects */}
      {folders.map((folder) => {
        const folderProjects = projects.filter(p => p.folder_id === folder.id)
        const isExpanded = expandedFolders.has(folder.id)

        return (
          <div key={folder.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            >
              <Folder className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">{folder.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {folderProjects.length === 0 
                    ? 'Empty folder' 
                    : `${folderProjects.length} project${folderProjects.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <ChevronRight 
                className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            </button>
            
            {isExpanded && (
              <div className="border-t border-border bg-muted/20">
                {folderProjects.length === 0 ? (
                  <div className="p-4 pl-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">This folder is empty</p>
                  </div>
                ) : (
                  folderProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${folder.slug}/${project.slug}`}
                      className="block p-4 pl-12 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">{project.status}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {rootProjects.length === 0 && folders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No projects found</p>
        </div>
      )}
    </div>
  )
}