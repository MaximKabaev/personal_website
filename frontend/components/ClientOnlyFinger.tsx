"use client"
import React from "react"
import TerminalReveal from "./TerminalReveal"

export default function ClientOnlyFinger() {
  return (
  <TerminalReveal command="finger maxim" typingSpeed={60} pauseAfter={500} sequential>
      <div>
        <p className="text-muted-foreground">my dms are open on X/Twitter at @MaximKabaev21. always open to discuss anything.</p>
      </div>
    </TerminalReveal>
  )
}
