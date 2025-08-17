'use client'

import dynamic from 'next/dynamic'

// Dynamically import ThemeToggle with no SSR to avoid hydration issues
const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => (
    <div className="p-2 rounded-lg">
      <div className="w-4 h-4" />
    </div>
  )
})

export default function ClientThemeToggle() {
  return <ThemeToggle />
}