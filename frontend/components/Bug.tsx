"use client"
import React, { useState, useEffect, useRef } from "react"

type BugType = 'beetle' | 'spider' | 'fly' | 'ant'

type Props = {
  id: string
  type: BugType
  initialX: number
  initialY: number
  containerWidth: number
  containerHeight: number
  onKilled: (id: string) => void
  gameActive: boolean
}

export default function Bug({ id, type, initialX, initialY, containerWidth, containerHeight, onKilled, gameActive }: Props) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [isDead, setIsDead] = useState(false)
  const [direction, setDirection] = useState(Math.random() * 360)
  const [speed, setSpeed] = useState(Math.random() * 2 + 1)
  const intervalRef = useRef<NodeJS.Timeout>()

  const bugEmojis = {
    beetle: '🪲',
    spider: '🕷️',
    fly: '🦟',
    ant: '🐜'
  }

  const getBugSize = () => {
    switch (type) {
      case 'fly':
        return { width: 16, height: 16 }
      case 'ant':
        return { width: 12, height: 12 }
      case 'spider':
        return { width: 20, height: 20 }
      case 'beetle':
        return { width: 18, height: 18 }
    }
  }

  const getMovementPattern = () => {
    switch (type) {
      case 'fly':
        // Erratic flying pattern
        return {
          speedVariation: 0.5,
          directionChange: 0.3,
          boundaryBehavior: 'bounce'
        }
      case 'spider':
        // Slow, deliberate movement
        return {
          speedVariation: 0.2,
          directionChange: 0.1,
          boundaryBehavior: 'edge-crawl'
        }
      case 'beetle':
        // Steady crawling
        return {
          speedVariation: 0.3,
          directionChange: 0.15,
          boundaryBehavior: 'turn'
        }
      case 'ant':
        // Fast, straight lines
        return {
          speedVariation: 0.4,
          directionChange: 0.05,
          boundaryBehavior: 'turn'
        }
    }
  }

  useEffect(() => {
    if (!gameActive || isDead) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    const pattern = getMovementPattern()
    
    intervalRef.current = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x
        let newY = prev.y
        let newDirection = direction
        let newSpeed = speed

        // Apply movement
        const radians = (direction * Math.PI) / 180
        newX += Math.cos(radians) * speed
        newY += Math.sin(radians) * speed

        // Handle boundary collisions
        const bugSize = getBugSize()
        const margin = 10

        if (newX <= margin || newX >= containerWidth - bugSize.width - margin) {
          if (pattern.boundaryBehavior === 'bounce') {
            newDirection = 180 - direction
          } else if (pattern.boundaryBehavior === 'edge-crawl') {
            // Spiders crawl along edges
            if (newX <= margin) {
              newX = margin
              newDirection = Math.random() * 180 - 90 // Turn towards center
            } else {
              newX = containerWidth - bugSize.width - margin
              newDirection = Math.random() * 180 + 90 // Turn towards center
            }
          } else {
            newDirection = direction + (Math.random() * 120 - 60) // Random turn
          }
        }

        if (newY <= margin || newY >= containerHeight - bugSize.height - margin) {
          if (pattern.boundaryBehavior === 'bounce') {
            newDirection = -direction
          } else if (pattern.boundaryBehavior === 'edge-crawl') {
            if (newY <= margin) {
              newY = margin
              newDirection = Math.random() * 180 // Turn towards center
            } else {
              newY = containerHeight - bugSize.height - margin
              newDirection = Math.random() * 180 - 180 // Turn towards center
            }
          } else {
            newDirection = direction + (Math.random() * 120 - 60) // Random turn
          }
        }

        // Clamp position within bounds
        newX = Math.max(margin, Math.min(containerWidth - bugSize.width - margin, newX))
        newY = Math.max(margin, Math.min(containerHeight - bugSize.height - margin, newY))

        // Random direction changes
        if (Math.random() < pattern.directionChange) {
          newDirection += (Math.random() * 60 - 30)
        }

        // Speed variation
        if (Math.random() < pattern.speedVariation) {
          newSpeed = Math.max(0.5, Math.min(4, speed + (Math.random() * 1 - 0.5)))
        }

        // Update direction and speed
        if (newDirection !== direction) setDirection(newDirection)
        if (newSpeed !== speed) setSpeed(newSpeed)

        return { x: newX, y: newY }
      })
    }, 50) // 20 FPS

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [gameActive, isDead, direction, speed, containerWidth, containerHeight, type])

  const handleClick = () => {
    if (!isDead && gameActive) {
      setIsDead(true)
      onKilled(id)
    }
  }

  if (isDead) {
    return (
      <div
        className="absolute pointer-events-none select-none animate-pulse"
        style={{
          left: position.x,
          top: position.y,
          ...getBugSize()
        }}
      >
        <div className="text-red-600 font-bold text-xs">💀</div>
      </div>
    )
  }

  return (
    <div
      className="absolute select-none hover:scale-110 transition-transform z-50"
      style={{
        left: position.x,
        top: position.y,
        ...getBugSize(),
        cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'><circle cx=\'24\' cy=\'24\' r=\'2\' fill=\'red\'/><line x1=\'24\' y1=\'8\' x2=\'24\' y2=\'16\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'24\' y1=\'32\' x2=\'24\' y2=\'40\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'8\' y1=\'24\' x2=\'16\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/><line x1=\'32\' y1=\'24\' x2=\'40\' y2=\'24\' stroke=\'red\' stroke-width=\'2\'/></svg>") 24 24, crosshair'
      }}
      onClick={handleClick}
      title={`Click to kill the ${type}!`}
    >
      <div 
        className="animate-bounce"
        style={{ 
          fontSize: getBugSize().width,
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
        }}
      >
        {bugEmojis[type]}
      </div>
    </div>
  )
}