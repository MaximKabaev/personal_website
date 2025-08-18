"use client"
import React, { useState, useEffect, useRef } from "react"
import ClientOnlyTree from "./ClientOnlyTree"
import TerminalEmulator from "./TerminalEmulator"

type Props = {
  projects: any[]
  folders: any[]
  skipAnimation?: boolean
}

export default function DevTerminalSection({ projects, folders, skipAnimation = false }: Props) {
  const [showTerminal, setShowTerminal] = useState(skipAnimation)
  const setCommandRef = useRef<((command: string, autoExecute?: boolean) => void) | null>(null)
  
  const handleTreeComplete = () => {
    setShowTerminal(true)
  }
  
  const handleProjectClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    if (setCommandRef.current) {
      setCommandRef.current(`nano ~/${path}`, true) // true = auto-execute
    }
  }

  if (skipAnimation) {
    // Show everything instantly without animations
    return (
      <>
        <section className="mb-12">
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
                                  onClick={(e) => handleProjectClick(e, `projects/${folder.slug}/${project.slug}`)}
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
                            onClick={(e) => handleProjectClick(e, project.slug)}
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
        </section>

        <section className="mb-12">
          <TerminalEmulator projects={projects} folders={folders} commandRef={setCommandRef} />
        </section>
      </>
    )
  }

  return (
    <>
      <section className="mb-12">
        <ClientOnlyTree 
          projects={projects} 
          folders={folders} 
          onComplete={handleTreeComplete}
          onProjectClick={(path) => {
            if (setCommandRef.current) {
              setCommandRef.current(`nano ~/${path}`, true) // true = auto-execute
            }
          }}
        />
      </section>

      {showTerminal && (
        <section className="mb-12 animate-fadeIn">
          <TerminalEmulator projects={projects} folders={folders} commandRef={setCommandRef} />
        </section>
      )}
    </>
  )
}