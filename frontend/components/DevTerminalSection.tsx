"use client"
import React, { useState, useEffect } from "react"
import ClientOnlyTree from "./ClientOnlyTree"
import TerminalEmulator from "./TerminalEmulator"
import { useTerminalSequence } from "./TerminalSequence"

type Props = {
  projects: any[]
  folders: any[]
}

export default function DevTerminalSection({ projects, folders }: Props) {
  const [showTerminal, setShowTerminal] = useState(false)
  const seq = useTerminalSequence()

  useEffect(() => {
    // Calculate when tree animation completes
    // Tree command takes about: command typing + pause + content reveal
    const treeCommandDuration = "tree /usr/maxim".length * 40 + 200
    
    // Count items to display (folders + projects)
    const itemCount = folders.length + projects.length
    // Rough estimate: each item takes some time to appear
    const treeContentDuration = itemCount * 50

    const totalDuration = treeCommandDuration + treeContentDuration + 500 // Add buffer

    const timer = setTimeout(() => {
      setShowTerminal(true)
    }, totalDuration)

    return () => clearTimeout(timer)
  }, [folders.length, projects.length])

  return (
    <>
      <section className="mb-12">
        <ClientOnlyTree projects={projects} folders={folders} />
      </section>

      {showTerminal && (
        <section className="mb-12 animate-fadeIn">
          <TerminalEmulator projects={projects} folders={folders} />
        </section>
      )}
    </>
  )
}