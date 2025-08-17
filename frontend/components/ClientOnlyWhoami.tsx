"use client"
import React from "react"
import TerminalReveal from "./TerminalReveal"

export default function ClientOnlyWhoami() {
  return (
    <TerminalReveal command="whoami" typingSpeed={60} pauseAfter={400} sequential>
      <p className="text-muted-foreground leading-relaxed">
        hi. im maxim, a developer who enjoys building interesting projects and sharing the journey. this is my
        devlog where i document progress, thoughts, and learnings from various projects. each entry includes
        timestamps and personal reflections on the development process.
      </p>
  </TerminalReveal>
  )
}
