import { getProjects, getFolderTree } from "@/lib/api"
import LandingWrapper from "@/components/LandingWrapper"

export default async function HomePage() {
  let projects = [] as any[]
  let folders = [] as any[]

  try {
    [projects, folders] = await Promise.all([
      getProjects(),
      getFolderTree()
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }

  return <LandingWrapper projects={projects} folders={folders} />
}
