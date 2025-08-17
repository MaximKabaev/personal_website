import Link from "next/link"
import Image from "next/image"
import { getProjects, getRecentEntries, getFolderTree } from "@/lib/api"

export default async function HomePage() {
  let projects = [] as any[]
  let folders = [] as any[]
  let recentEntries = [] as any[]

  try {
    [projects, folders] = await Promise.all([
      getProjects(),
      getFolderTree()
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
  
  try {
    recentEntries = await getRecentEntries(5)
  } catch (error) {
    console.error('Failed to fetch recent entries:', error)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header with cover image */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div className="absolute inset-0 bg-[url('/landing-cover.jpg')] bg-cover" style={{ backgroundPosition: 'center 50%' }}></div>
          <div className="relative z-10 py-8 px-6 bg-black/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-500">
                <Image
                  src="/profile-avatar.jpg"
                  alt="Maxim Kabaev"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-0">MAXIM KABAEV</h1>
                <p className="text-slate-300 text-sm -mt-0.5">software & aerospace engineer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* About Section */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">WHOAMI</h2>
          <p className="text-muted-foreground leading-relaxed">
            hi. im maxim, a developer who enjoys building interesting projects and sharing the journey. this is my
            devlog where i document progress, thoughts, and learnings from various projects. each entry includes
            timestamps and personal reflections on the development process.
          </p>
        </section>

        {/* Projects Section */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">DEVLOG</h2>
          <div className="font-mono text-sm">
            <div className="text-muted-foreground mb-2">/usr/maxim</div>
            <div className="ml-4">
              <div className="text-muted-foreground mb-2">└─ projects</div>
              <div className="ml-4 space-y-1">
                {projects.length > 0 || folders.length > 0 ? (
                  <>
                    {/* Show folders and their projects */}
                    {folders.map((folder, folderIndex) => {
                      const folderProjects = projects.filter(p => p.folder_id === folder.id)
                      const isLast = folderIndex === folders.length - 1 && projects.filter(p => !p.folder_id).length === 0
                      
                      return (
                        <div key={folder.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{isLast ? '└─' : '├─'}</span>
                            <span className="text-muted-foreground">{folder.name}/</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {folderProjects.map((project, projectIndex) => (
                              <div key={project.id} className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {projectIndex === folderProjects.length - 1 ? '└─' : '├─'}
                                </span>
                                <Link
                                  href={`/projects/${folder.slug}/${project.slug}`}
                                  className="text-foreground hover:text-primary underline transition-colors"
                                >
                                  {project.name}
                                </Link>
                                <span className="text-muted-foreground text-xs">({project.status})</span>
                              </div>
                            ))}
                            {folderProjects.length === 0 && (
                              <div className="text-muted-foreground italic">
                                <span className="mr-2">└─</span>
                                <span>empty</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Show root-level projects (no folder) */}
                    {projects.filter(p => !p.folder_id).map((project, index) => {
                      const rootProjects = projects.filter(p => !p.folder_id)
                      const isLast = index === rootProjects.length - 1
                      
                      return (
                        <div key={project.id} className="flex items-center gap-2">
                          <span className="text-muted-foreground">{isLast ? '└─' : '├─'}</span>
                          <Link
                            href={`/projects/${project.slug}`}
                            className="text-foreground hover:text-primary underline transition-colors"
                          >
                            {project.name}
                          </Link>
                          <span className="text-muted-foreground text-xs">({project.status})</span>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <div className="text-muted-foreground italic">
                    <span className="mr-2">└─</span>
                    <span>no projects yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Entries */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">RECENT ENTRIES</h2>
          <div className="space-y-4">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <Link href={`/projects/${entry.project_id}`} className="hover:text-primary transition-colors">
                      {entry.project?.name || 'Unknown Project'}
                    </Link>
                  </div>
                  <p className="text-foreground">{entry.title}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">no entries yet. start building something!</p>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">CONTACT</h2>
          <p className="text-muted-foreground">my dms are open on X/Twitter at @MaximKabaev21</p>
          <p className="text-muted-foreground mt-2">always open to discuss anything.</p>
        </section>
      </div>
    </div>
  )
}
