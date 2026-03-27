"use client"
import React from "react"
import TerminalReveal from "./TerminalReveal"

type Props = {
  projects: any[]
  folders: any[]
  onComplete?: () => void
  onProjectClick?: (path: string) => void
}

function renderFolderTree(
  folder: any,
  projects: any[],
  isLast: boolean,
  pathPrefix: string,
  onProjectClick?: (path: string) => void
) {
  const folderProjects = projects.filter((p: any) => p.folder_id === folder.id)
  const children = folder.children || []
  const allItems = [...children, ...folderProjects]
  const folderPath = pathPrefix ? `${pathPrefix}/${folder.slug}` : folder.slug

  return (
    <div key={folder.id}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{isLast ? '└─' : '├─'}</span>
        <span className="text-muted-foreground">{folder.name}/</span>
      </div>
      <div className="ml-6 space-y-1">
        {children.map((child: any, i: number) =>
          renderFolderTree(
            child,
            projects,
            i === children.length - 1 && folderProjects.length === 0,
            folderPath,
            onProjectClick
          )
        )}
        {folderProjects.map((project: any, projectIndex: number) => (
          <div key={project.id} className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {projectIndex === folderProjects.length - 1 ? '└─' : '├─'}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault()
                if (onProjectClick) {
                  onProjectClick(`projects/${folderPath}/${project.slug}`)
                }
              }}
              className="text-foreground hover:text-primary underline transition-colors cursor-pointer"
            >
              {project.name}
            </button>
            <span className="text-muted-foreground text-xs">({project.status})</span>
          </div>
        ))}
        {allItems.length === 0 && (
          <div className="text-muted-foreground italic">
            <span className="mr-2">└─</span>
            <span>empty</span>
          </div>
        )}
      </div>
    </div>
  )
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
                {folders.map((folder, folderIndex) =>
                  renderFolderTree(
                    folder,
                    projects,
                    folderIndex === folders.length - 1 && projects.filter(p => !p.folder_id).length === 0,
                    '',
                    onProjectClick
                  )
                )}

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
