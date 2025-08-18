"use client"
import React from "react"
import { X, Sun, Moon } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

type Props = {
  isDev: boolean | null
  onReset: () => void
  onClose: () => void
}

export default function InlineMobileMenu({ isDev, onReset, onClose }: Props) {
  const { resolvedTheme, setTheme, theme } = useTheme()

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
    <div className="flex items-center justify-between w-full h-12">
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-md transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <>
              <Moon className="w-3 h-3 text-white" />
              <span className="text-xs text-white">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3 h-3 text-white" />
              <span className="text-xs text-white">Light</span>
            </>
          )}
        </button>

        {/* Mode Selection */}
        {isDev !== null && (
          <button
            onClick={onReset}
            className="px-2 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-md transition-colors text-xs text-white whitespace-nowrap"
          >
            [exit]
          </button>
        )}
      </div>
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}