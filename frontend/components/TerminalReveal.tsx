"use client"
import React, { useEffect, useRef, useState } from "react"
import { useTerminalSequence } from "./TerminalSequence"

type Props = {
  command?: string
  typingSpeed?: number
  pauseAfter?: number
  className?: string
  children?: React.ReactNode
  sequential?: boolean
  showLeadingPrompt?: boolean
}

export default function TerminalReveal({
  command = "tree /usr/maxim",
  typingSpeed = 40,
  pauseAfter = 200,
  className = "",
  children,
  sequential = false,
  showLeadingPrompt = true,
}: Props) {
  const [typed, setTyped] = useState("")
  const [show, setShow] = useState(false)
  const seq = useTerminalSequence()
  const assignedRef = useRef<number | null>(null)
  const [leadingVisible, setLeadingVisible] = useState<boolean>(false)

  // compute and register start delay once (deterministic render order)
  if (sequential && assignedRef.current === null) {
    const duration = command.length * typingSpeed + pauseAfter
    assignedRef.current = seq.register(duration)
  }

  const assigned = assignedRef.current ?? 0
  // initial leading visibility: show immediately if not sequential and allowed
  const initialLeading = showLeadingPrompt && (!sequential || assigned === 0)
  if (initialLeading && !leadingVisible) setLeadingVisible(true)

  useEffect(() => {
  const startDelay = sequential ? (assignedRef.current ?? 0) : 0

    let i = 0
    const startTimerRef = { current: null as null | ReturnType<typeof setTimeout> }
    const intervalRef = { current: null as null | ReturnType<typeof setInterval> }

    startTimerRef.current = setTimeout(() => {
      // show leading prompt at the moment this command begins
      if (showLeadingPrompt) setLeadingVisible(true)
      intervalRef.current = setInterval(() => {
        setTyped(command.slice(0, i + 1))
        i++
        if (i === command.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeout(() => setShow(true), pauseAfter)
        }
      }, typingSpeed)
    }, startDelay)

    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [command, typingSpeed, pauseAfter, sequential])

  return (
    <div className={className}>
      <div className="font-mono text-sm text-foreground">
        {leadingVisible && <span className="text-muted-foreground mr-1">$</span>}
        <span>{typed}</span>
        {!show && typed.length === command.length && (
          <span
            aria-hidden
            className="ml-1 inline-block w-[2px] h-[1em] bg-current animate-pulse"
            style={{ verticalAlign: 'text-bottom', transform: 'translateY(-0.18em)' }}
          />
        )}
      </div>

      {show && <div className="mt-2">{children}</div>}
    </div>
  )
}
