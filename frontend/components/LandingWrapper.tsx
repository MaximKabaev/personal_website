"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"
import ClientThemeToggle from "./ClientThemeToggle"
import DevPrompt from "./DevPrompt"
import ClientOnlyTree from "./ClientOnlyTree"
import ClientOnlyWhoami from "./ClientOnlyWhoami"
import ClientOnlyFinger from "./ClientOnlyFinger"
import { TerminalSequenceProvider } from "./TerminalSequence"
import Link from "next/link"

type Props = {
  projects: any[]
  folders: any[]
}

export default function LandingWrapper({ projects, folders }: Props) {
  const [isDev, setIsDev] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem("isDev")
    if (stored !== null) {
      setIsDev(stored === "true")
    }
    setIsLoading(false)
  }, [])

  const handleSelection = (isDevMode: boolean) => {
    setIsDev(isDevMode)
  }

  const resetPreference = () => {
    localStorage.removeItem("isDev")
    setIsDev(null)
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground font-mono"
      style={{ ['--bg-pos' as string]: 'center 50%' }}
    >
      {/* Header with cover image - always shown */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div
            className="absolute inset-0 bg-cover bg-[url('/landing-cover.jpg')] dark:bg-[url('/landing-cover-dark.jpg')] dark:[--bg-pos:center_22%]"
            style={{ backgroundPosition: 'var(--bg-pos)' }}
          ></div>
          <div className="relative z-10 py-8 px-6 bg-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-500">
                  <Image
                    src="/profile-avatar.jpg"
                    alt="Maxim Kabaev"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-0">MAXIM KABAEV</h1>
                  <p className="text-slate-300 text-sm -mt-0.5">
                    {isDev !== false ? "software & aerospace engineer" : "Software & Aerospace Engineer"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClientThemeToggle />
                {isDev !== null && (
                  <button
                    onClick={resetPreference}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title={isDev ? "Switch to normal view" : "Switch to terminal view"}
                  >
                    [{isDev ? "exit" : "terminal"}]
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        ) : isDev === null ? (
          // Show prompt
          <section className="mb-12">
            <DevPrompt onSelection={handleSelection} />
          </section>
        ) : isDev ? (
          // Show terminal style content
          <TerminalSequenceProvider>
            <section className="mb-12">
              <ClientOnlyWhoami />
            </section>

            <section className="mb-12">
              <ClientOnlyTree projects={projects} folders={folders} />
            </section>

            <section>
              <ClientOnlyFinger />
            </section>
          </TerminalSequenceProvider>
        ) : (
          // Show normal style content
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">About Me</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hi! I'm Maxim, a developer who enjoys building interesting projects and sharing the journey. 
                This is my devlog where I document progress, thoughts, and learnings from various projects. 
                Each entry includes timestamps and personal reflections on the development process.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Projects</h2>
              <div className="grid gap-6">
                {folders.map((folder) => {
                  const folderProjects = projects.filter(p => p.folder_id === folder.id)
                  
                  return (
                    <div key={folder.id} className="bg-muted/10 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-3">{folder.name}</h3>
                      <div className="grid gap-3">
                        {folderProjects.length > 0 ? (
                          folderProjects.map((project) => (
                            <Link
                              key={project.id}
                              href={`/projects/${folder.slug}/${project.slug}`}
                              className="block p-4 bg-background rounded border border-muted hover:border-primary transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{project.name}</span>
                                <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                                  {project.status}
                                </span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-muted-foreground italic">No projects yet</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {projects.filter(p => !p.folder_id).length > 0 && (
                  <div className="bg-muted/10 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Other Projects</h3>
                    <div className="grid gap-3">
                      {projects.filter(p => !p.folder_id).map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.slug}`}
                          className="block p-4 bg-background rounded border border-muted hover:border-primary transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                              {project.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact</h2>
              <p className="text-muted-foreground">
                My DMs are open on X/Twitter at <a href="https://twitter.com/MaximKabaev21" className="text-primary hover:underline">@MaximKabaev21</a>
              </p>
              <p className="text-muted-foreground mt-2">Always open to discuss anything!</p>
            </section>
          </>
        )}
      </div>
    </div>
  )
}