"use client"
import React, { useState } from "react"
import Link from "next/link"
import { ChevronRight, Folder, FolderOpen, FileText } from "lucide-react"

type Project = {
  id: string
  name: string
  slug: string
  status: string
  folder_id: string | null
}

type FolderType = {
  id: string
  name: string
  slug: string
}

type Props = {
  folder?: FolderType
  projects: Project[]
  isRoot?: boolean
}

export default function WindowsFolder({ folder, projects, isRoot = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleFolder = () => {
    setIsOpen(!isOpen)
  }

  if (isRoot && projects.length === 0) {
    return (
      <div className="text-muted-foreground italic text-center py-4">
        No projects yet
      </div>
    )
  }

  if (isRoot) {
    // Root level projects without folder
    return (
      <div className="space-y-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="flex items-center gap-3 p-3 rounded hover:bg-muted/20 transition-colors group"
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="flex-1 group-hover:text-primary transition-colors">{project.name}</span>
            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">
              {project.status}
            </span>
          </Link>
        ))}
      </div>
    )
  }

  if (!folder) return null

  return (
    <div className="select-none">
      <div
        onClick={toggleFolder}
        className="flex items-center gap-2 p-3 rounded hover:bg-muted/20 transition-colors cursor-pointer"
      >
        <ChevronRight 
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        {isOpen ? (
          <FolderOpen className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        ) : (
          <Folder className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        )}
        <span className="font-medium">{folder.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {projects.length} item{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isOpen && (
        <div className="ml-6 mt-1 space-y-1 animate-fadeIn">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${folder.slug}/${project.slug}`}
                className="flex items-center gap-3 p-2 pl-6 rounded hover:bg-muted/20 transition-colors group"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="flex-1 group-hover:text-primary transition-colors text-sm">
                  {project.name}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded">
                  {project.status}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-muted-foreground italic text-sm pl-6 py-2">
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  )
}