"use client"
import { useEffect } from "react"

export default function AnimationTracker() {
  useEffect(() => {
    // Mark that animations have been shown after a delay
    const timer = setTimeout(() => {
      sessionStorage.setItem("animationShown", "true")
    }, 3000) // After 3 seconds, mark animations as complete
    
    return () => clearTimeout(timer)
  }, [])
  
  return null
}