'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
        <div className="w-4 h-4" />
      </button>
    )
  }

  const toggleTheme = () => {
    // If system theme, switch to opposite of current resolved theme
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      // Otherwise just toggle
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-white hover:text-black transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-white hover:text-black transition-colors" />
      )}
    </button>
  )
}