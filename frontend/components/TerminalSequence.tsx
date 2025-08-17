"use client"
import React, { createContext, useContext, useRef } from "react"

type SequenceContextType = {
  register: (duration: number) => number
}

const SequenceContext = createContext<SequenceContextType | null>(null)

export function TerminalSequenceProvider({ children }: { children: React.ReactNode }) {
  const cumulative = useRef(0)

  const register = (duration: number) => {
    const assigned = cumulative.current
    // add a small buffer between commands for realism
    cumulative.current = assigned + duration + 200
    return assigned
  }

  return (
    <SequenceContext.Provider value={{ register }}>{children}</SequenceContext.Provider>
  )
}

export function useTerminalSequence() {
  const ctx = useContext(SequenceContext)
  return ctx ?? { register: () => 0 }
}
