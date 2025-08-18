"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"
import ClientThemeToggle from "./ClientThemeToggle"
import DevPrompt from "./DevPrompt"
import ClientOnlyWhoami from "./ClientOnlyWhoami"
import ClientOnlyFinger from "./ClientOnlyFinger"
import DevTerminalSection from "./DevTerminalSection"
import { TerminalSequenceProvider } from "./TerminalSequence"
import Link from "next/link"
import WindowsFolder from "./WindowsFolder"
import WindowsExplorer from "./WindowsExplorer"
import WindowsDesktop from "./WindowsDesktop"
import MobileProjects from "./MobileProjects"
import AnimationTracker from "./AnimationTracker"
import { RotateCcw } from "lucide-react"

type Props = {
  projects: any[]
  folders: any[]
}

export default function LandingWrapper({ projects, folders }: Props) {
  const [isDev, setIsDev] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const [showReloadButton, setShowReloadButton] = useState(false)
  const [reloadFunction, setReloadFunction] = useState<(() => void) | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem("isDev")
    if (stored !== null) {
      setIsDev(stored === "true")
      
      // Check if animations have been shown already in this session
      const animationShown = sessionStorage.getItem("animationShown")
      setSkipAnimation(animationShown === "true")
    } else {
      // No choice made yet - reset animation flag for dev prompt
      sessionStorage.removeItem("animationShown")
      setSkipAnimation(false)
    }
    
    // Check if mobile/small screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Tailwind's md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    setIsLoading(false)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSelection = (isDevMode: boolean) => {
    setIsDev(isDevMode)
    localStorage.setItem("isDev", String(isDevMode))
    // Reset animation flag when making a new selection
    sessionStorage.removeItem("animationShown")
    setSkipAnimation(false)
  }

  const resetPreference = () => {
    localStorage.removeItem("isDev")
    sessionStorage.removeItem("animationShown")
    // Clear terminal state when switching modes
    sessionStorage.removeItem("terminalHistory")
    sessionStorage.removeItem("terminalPath")
    sessionStorage.removeItem("commandHistory")
    setIsDev(null)
  }

  const handleReloadStateChange = (showReload: boolean, reloadFn: () => void) => {
    setShowReloadButton(showReload)
    setReloadFunction(() => reloadFn)
  }

  const handleReloadClick = () => {
    if (reloadFunction) {
      reloadFunction()
    }
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
                    className="text-xs text-white hover:text-slate-200 transition-colors"
                    title={isDev ? "Switch to normal view" : "Switch to terminal view"}
                  >
                    [exit]
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
          // Show prompt - animations should play after selection
          <section className="mb-12">
            <DevPrompt onSelection={handleSelection} />
          </section>
        ) : isDev ? (
          // Show terminal style content
          skipAnimation ? (
            // Skip animations when returning from navigation
            <>
              <section className="mb-12">
                <div className="font-mono text-sm mb-2">
                  <span className="text-muted-foreground mr-1">$</span>
                  <span>whoami</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  hi. im maxim, a developer who enjoys building interesting projects and sharing the journey. this is my
                  devlog where i document progress, thoughts, and learnings from various projects. each entry includes
                  timestamps and personal reflections on the development process.
                </p>
              </section>

              <DevTerminalSection projects={projects} folders={folders} skipAnimation={true} />

              <section>
                <div className="font-mono text-sm mb-2">
                  <span className="text-muted-foreground mr-1">$</span>
                  <span 
                    className="hover:cursor-pointer"
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><text y=\'20\' font-size=\'20\'>🤤</text></svg>"), pointer'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.cursor = 'default'
                    }}
                  >
                    finger maxim
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">my dms are open on X/Twitter at @MaximKabaev21. always open to discuss anything.</p>
                </div>
              </section>
            </>
          ) : (
            // Show animations on first load
            <TerminalSequenceProvider>
              <AnimationTracker />
              <section className="mb-12">
                <ClientOnlyWhoami />
              </section>

              <DevTerminalSection projects={projects} folders={folders} />

              <section>
                <ClientOnlyFinger />
              </section>
            </TerminalSequenceProvider>
          )
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
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                {showReloadButton && !isMobile && (
                  <button
                    onClick={handleReloadClick}
                    className="p-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    title="Reset Explorer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isMobile ? (
                <MobileProjects 
                  projects={projects} 
                  folders={folders} 
                />
              ) : (
                <WindowsDesktop 
                  projects={projects} 
                  folders={folders} 
                  onReloadStateChange={handleReloadStateChange}
                />
              )}
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