'use client'

import { useState, useEffect } from 'react'
import LandingWrapper from "@/components/LandingWrapper"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, foldersRes] = await Promise.all([
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/folders/tree`)
        ])
        
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData)
        }
        
        if (foldersRes.ok) {
          const foldersData = await foldersRes.json()
          setFolders(foldersData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return <LandingWrapper projects={projects} folders={folders} />
}
