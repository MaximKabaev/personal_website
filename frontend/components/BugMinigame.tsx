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
  containerWidth: number
  containerHeight: number
  onScoreChange?: (score: number) => void
  onTimeChange?: (time: number) => void
  onGameEnd?: (finalScore: number) => void
}

export default function BugMinigame({ isActive, onClose, containerWidth, containerHeight, onScoreChange, onTimeChange, onGameEnd }: Props) {
  const [bugs, setBugs] = useState<BugData[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'ended'>('playing')
  const [wave, setWave] = useState(1)
  const spawnIntervalRef = useRef<NodeJS.Timeout>()
  const gameTimerRef = useRef<NodeJS.Timeout>()

  const bugTypes: Array<'beetle' | 'spider' | 'fly' | 'ant'> = ['beetle', 'spider', 'fly', 'ant']

  const spawnBug = () => {
    const bugType = bugTypes[Math.floor(Math.random() * bugTypes.length)]
    const margin = 50
    const x = Math.random() * (containerWidth - margin * 2) + margin
    const y = Math.random() * (containerHeight - margin * 2) + margin
    
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
    setScore(prev => {
      const newScore = prev + 10
      onScoreChange?.(newScore)
      return newScore
    })
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === ' ') {
      event.preventDefault()
      if (gameState === 'playing') {
        setGameState('paused')
      } else if (gameState === 'paused') {
        setGameState('playing')
      }
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
          onTimeChange?.(0)
          // Use setScore callback to get the latest score value
          setScore(currentScore => {
            onGameEnd?.(currentScore)
            return currentScore
          })
          return 0
        }
        const newTime = prev - 1
        onTimeChange?.(newTime)
        return newTime
      })
    }, 1000)

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current)
      }
    }
  }, [isActive, gameState])

  // Bug spawning
  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
      }
      return
    }

    const spawnRate = Math.max(500, 1200 - (wave * 100)) // Faster spawning each wave
    
    spawnIntervalRef.current = setInterval(() => {
      spawnBug()
    }, spawnRate)

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current)
      }
    }
  }, [isActive, gameState, wave, containerWidth, containerHeight])

  // Wave progression
  useEffect(() => {
    if (score > 0 && score % 50 === 0) { // New wave every 50 points
      setWave(prev => prev + 1)
    }
  }, [score])

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
    <div 
      className="absolute inset-0 z-40 pointer-events-auto"
      style={{ 
        cursor: gameState === 'playing' 
          ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'><circle cx=\'24\' cy=\'24\' r=\'2\' fill=\'red\'/><line x1=\'24\' y1=\'8\' x2=\'24\' y2=\'16\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'24\' y1=\'32\' x2=\'24\' y2=\'40\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'8\' y1=\'24\' x2=\'16\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'32\' y1=\'24\' x2=\'40\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/></svg>") 24 24, crosshair' 
          : 'default' 
      }}
    >

      {/* Game State Overlays */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Press SPACE to resume</p>
            <button 
              onClick={onClose}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Exit Game
            </button>
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
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          onKilled={handleBugKilled}
          gameActive={gameState === 'playing'}
        />
      ))}

    </div>
  )
}