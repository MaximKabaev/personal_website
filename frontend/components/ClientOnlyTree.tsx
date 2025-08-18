"use client"
import React from "react"
import TerminalReveal from "./TerminalReveal"

type Props = {
  projects: any[]
  folders: any[]
  onComplete?: () => void
  onProjectClick?: (path: string) => void
}

export default function ClientOnlyTerminal({ projects, folders, onComplete, onProjectClick }: Props) {
  return (
  <TerminalReveal sequential onComplete={onComplete}>
      <div className="font-mono text-sm">
        <div className="text-muted-foreground mb-2">/usr/maxim</div>
        <div className="ml-4">
          <div className="text-muted-foreground mb-2">└─ projects</div>
          <div className="ml-4 space-y-1">
            {projects.length > 0 || folders.length > 0 ? (
              <>
                {folders.map((folder, folderIndex) => {
                  const folderProjects = projects.filter(p => p.folder_id === folder.id)
                  const isLast = folderIndex === folders.length - 1 && projects.filter(p => !p.folder_id).length === 0

                  return (
                    <div key={folder.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{isLast ? '└─' : '├─'}</span>
                        <span className="text-muted-foreground">{folder.name}/</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {folderProjects.map((project, projectIndex) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {projectIndex === folderProjects.length - 1 ? '└─' : '├─'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                if (onProjectClick) {
                                  onProjectClick(`projects/${folder.slug}/${project.slug}`)
                                }
                              }}
                              className="text-foreground hover:text-primary underline transition-colors cursor-pointer"
                            >
                              {project.name}
                            </button>
                            <span className="text-muted-foreground text-xs">({project.status})</span>
                          </div>
                        ))}
                        {folderProjects.length === 0 && (
                          <div className="text-muted-foreground italic">
                            <span className="mr-2">└─</span>
                            <span>empty</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {projects.filter(p => !p.folder_id).map((project, index) => {
                  const rootProjects = projects.filter(p => !p.folder_id)
                  const isLast = index === rootProjects.length - 1

                  return (
                    <div key={project.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{isLast ? '└─' : '├─'}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          if (onProjectClick) {
                            onProjectClick(project.slug)
                          }
                        }}
                        className="text-foreground hover:text-primary underline transition-colors cursor-pointer"
                      >
                        {project.name}
                      </button>
                      <span className="text-muted-foreground text-xs">({project.status})</span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="text-muted-foreground italic">
                <span className="mr-2">└─</span>
                <span>no projects yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TerminalReveal>
  )
}
