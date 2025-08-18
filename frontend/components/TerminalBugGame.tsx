"use client"
import React, { useState, useEffect, useRef } from "react"
import Bug from "./Bug"

type BugData = {
  id: string
  type: 'beetle' | 'spider' | 'fly' | 'ant'
  x: number
  y: number
}

type Props = {
  isActive: boolean
  onClose: () => void
  onGameEnd?: (finalScore: number) => void
}

export default function TerminalBugGame({ isActive, onClose, onGameEnd }: Props) {
  const [bugs, setBugs] = useState<BugData[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing')
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 500 })
  const spawnIntervalRef = useRef<NodeJS.Timeout>()
  const gameTimerRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)
  const gameEndedRef = useRef(false)

  const bugTypes: Array<'beetle' | 'spider' | 'fly' | 'ant'> = ['beetle', 'spider', 'fly', 'ant']

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setContainerDimensions({ width: rect.width, height: rect.height })
    }
  }, [isActive])

  // Reset game state when game becomes active
  useEffect(() => {
    if (isActive) {
      setBugs([])
      setScore(0)
      setTimeLeft(30)
      setGameState('playing')
      gameEndedRef.current = false
    }
  }, [isActive])

  const spawnBug = () => {
    const bugType = bugTypes[Math.floor(Math.random() * bugTypes.length)]
    const margin = 50
    const x = Math.random() * (containerDimensions.width - margin * 2) + margin
    const y = Math.random() * (containerDimensions.height - margin * 2) + margin
    
    const newBug: BugData = {
      id: `bug-${Date.now()}-${Math.random()}`,
      type: bugType,
      x,
      y
    }

    setBugs(prev => [...prev, newBug])
  }

  const handleBugKilled = (bugId: string) => {
    setBugs(prev => prev.filter(bug => bug.id !== bugId))
    setScore(prev => prev + 10)
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  // Game timer
  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
      }
      return
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('ended')
          setScore(currentScore => {
            // Use setTimeout to avoid updating parent during render
            // Only call onGameEnd once
            if (!gameEndedRef.current) {
              gameEndedRef.current = true
              setTimeout(() => onGameEnd?.(currentScore), 0)
            }
            return currentScore
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
      }
    }
  }, [isActive, gameState, score, onGameEnd])

  // Bug spawning
  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
      }
      return
    }

    // If no bugs on screen, spawn one immediately
    if (bugs.length === 0) {
      spawnBug()
    }

    const spawnRate = Math.max(500, 1200 - (Math.floor(score / 50) * 100)) // Faster spawning as score increases
    
    spawnIntervalRef.current = setInterval(() => {
      spawnBug()
    }, spawnRate)

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
      }
    }
  }, [isActive, gameState, score, bugs.length, containerDimensions.width, containerDimensions.height])

  // Keyboard events
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyPress)
      return () => {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }
  }, [isActive, gameState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
      }
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
      }
    }
  }, [])

  if (!isActive) {
    return null
  }

  return (
    <>
      <style jsx>{`
        .terminal-game {
          background: #0d1117;
          border: 2px solid #30363d;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        .terminal-header {
          background: #21262d;
          border-bottom: 1px solid #30363d;
        }
        .terminal-content {
          background: #d1d5db;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div 
          ref={containerRef}
          className="terminal-game w-[90%] h-[80%] max-w-4xl max-h-3xl relative overflow-hidden"
          style={{ 
            cursor: gameState === 'playing' 
              ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'><circle cx=\'24\' cy=\'24\' r=\'2\' fill=\'red\'/><line x1=\'24\' y1=\'8\' x2=\'24\' y2=\'16\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'24\' y1=\'32\' x2=\'24\' y2=\'40\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'8\' y1=\'24\' x2=\'16\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'32\' y1=\'24\' x2=\'40\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/></svg>") 24 24, crosshair' 
              : 'default' 
          }}
        >
          {/* Terminal Header */}
          <div className="terminal-header px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button 
                  onClick={onClose}
                  className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer"
                  title="Close"
                ></button>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-green-400 font-mono text-sm">~ Bug Hunt v1.0</span>
            </div>
            <div className="flex items-center gap-4 text-green-400 font-mono text-sm">
              <span>Score: <span className="text-yellow-400">{score}</span></span>
              <span>Time: <span className="text-red-400">{timeLeft}s</span></span>
              <button 
                onClick={onClose}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                [ESC]
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="terminal-content h-full relative">
            {gameState === 'ended' && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
                <div className="text-green-400 font-mono text-center">
                  <div className="text-4xl mb-4">GAME OVER</div>
                  <div className="text-xl mb-4">Final Score: <span className="text-yellow-400">{score}</span></div>
                  <div className="text-sm text-gray-400 mb-6">
                    {score >= 100 ? "Excellent pest control!" : score >= 50 ? "Good job!" : "Keep practicing!"}
                  </div>
                  <div className="text-sm text-gray-500">Press ESC to return to terminal</div>
                </div>
              </div>
            )}

            {/* Bugs */}
            {bugs.map((bug) => (
              <Bug
                key={bug.id}
                id={bug.id}
                type={bug.type}
                initialX={bug.x}
                initialY={bug.y}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height - 60} // Account for header
                onKilled={handleBugKilled}
                gameActive={gameState === 'playing'}
              />
            ))}

            {/* Terminal prompt at bottom */}
            <div className="absolute bottom-4 left-4 text-green-400 font-mono text-sm">
              <span className="text-gray-500">maxim@bugkiller:</span>
              <span className="text-blue-400">~/hunt</span>
              <span className="text-gray-500">$ ./exterminate --mode=realtime</span>
              <span className="animate-pulse">_</span>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}