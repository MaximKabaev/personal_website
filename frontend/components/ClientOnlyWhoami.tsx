"use client"
import React from "react"
import TerminalReveal from "./TerminalReveal"

export default function ClientOnlyWhoami() {
  return (
    <TerminalReveal command="whoami" typingSpeed={60} pauseAfter={400} sequential>
      <p className="text-muted-foreground leading-relaxed">
        hi. im maxim, an aerospace engineering student at the university of bath with a strong
        background in software development (mostly self-taught). i’m passionate about building
        things, constantly exploring new ideas, and driven by the belief that with enough
        experiments, after enough startups fails, at least one will succeed — it’s simple statistics, you just gotta keep trying.
      </p>
  </TerminalReveal>
  )
}
