"use client"
import React, { useState, useEffect } from "react"

type Props = {
  onSelection: (isDev: boolean) => void
}

export default function DevPrompt({ onSelection }: Props) {
  const [typed, setTyped] = useState("")
  const [showOptions, setShowOptions] = useState(false)
  const [selectedOption, setSelectedOption] = useState<"yes" | "no">("yes")
  const command = "are you a dev?"
  const typingSpeed = 60
  
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTyped(command.slice(0, i + 1))
      i++
      if (i === command.length) {
        clearInterval(interval)
        setTimeout(() => setShowOptions(true), 300)
      }
    }, typingSpeed)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!showOptions) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        setSelectedOption(prev => prev === "yes" ? "no" : "yes")
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleSelection(selectedOption === "yes")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showOptions, selectedOption])

  const handleSelection = (isDev: boolean) => {
    // Store preference
    localStorage.setItem("isDev", isDev.toString())
    onSelection(isDev)
  }

  return (
    <div className="font-mono">
      <div className="text-sm mb-4">
        <span className="text-muted-foreground mr-1">$</span>
        <span>{typed}</span>
        {!showOptions && typed.length === command.length && (
          <span
            aria-hidden
            className="ml-1 inline-block w-[2px] h-[1em] bg-current animate-pulse"
            style={{ verticalAlign: 'text-bottom', transform: 'translateY(-0.18em)' }}
          />
        )}
      </div>

      {showOptions && (
        <div className="space-y-2 animate-fadeIn max-w-md">
          <button
            onClick={() => handleSelection(true)}
            onMouseEnter={() => setSelectedOption("yes")}
            className={`block w-full text-left px-3 py-2 rounded text-sm transition-all ${
              selectedOption === "yes"
                ? "bg-blue-600/20 border border-blue-500 text-blue-300"
                : "bg-muted/10 border border-muted hover:bg-muted/20"
            }`}
          >
            <span className="text-blue-400 mr-2">›</span>
            Yes, I speak terminal
          </button>
          
          <button
            onClick={() => handleSelection(false)}
            onMouseEnter={() => setSelectedOption("no")}
            className={`block w-full text-left px-3 py-2 rounded text-sm transition-all ${
              selectedOption === "no"
                ? "bg-blue-600/20 border border-blue-500 text-blue-300"
                : "bg-muted/10 border border-muted hover:bg-muted/20"
            }`}
          >
            <span className="text-blue-400 mr-2">›</span>
            No, show me normal view
          </button>

          <div className="text-xs text-muted-foreground mt-3">
            Use arrow keys to navigate, Enter to select
          </div>
        </div>
      )}
    </div>
  )
}