import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getProject, getProjectByPath, getProjectDevlog } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import ClientThemeToggle from "@/components/ClientThemeToggle"
import { DevlogImageGallery } from "@/components/DevlogImage"
import { formatDate, formatTime } from "@/lib/utils"

export const dynamic = 'force-dynamic'

interface ProjectPageProps {
  params: Promise<{
    slug: string[]
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await params
  let project = null
  let entries = [] as any[]

  try {
    // Check if it's a nested route (folder/project) or direct route (project)
    if (resolvedParams.slug.length === 2) {
      // Nested: /projects/folder/project
      const [folderSlug, projectSlug] = resolvedParams.slug
      project = await getProjectByPath(folderSlug, projectSlug)
    } else if (resolvedParams.slug.length === 1) {
      // Direct: /projects/project (could be ID or slug)
      const [identifier] = resolvedParams.slug
      project = await getProject(identifier)
    } else {
      // Invalid path
      notFound()
    }
    
    if (project) {
      entries = await getProjectDevlog(project.id)
    }
  } catch (error) {
    console.error('Failed to fetch project:', error)
    notFound()
  }

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header with cover image */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div className="absolute inset-0 bg-[url('/navbar-cover.png')] bg-cover bg-center"></div>
          <div className="relative z-10 py-8 px-6 bg-black/30">
            <div className="flex items-center justify-between">
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
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wide">{project.name}</h1>
                </div>
              </div>
              <ClientThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to home
        </Link>

        {/* Project Description */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-bold uppercase tracking-wide whitespace-nowrap">PROJECT OVERVIEW</h2>
            {/* Tech Stack Tags */}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech: string) => (
                  <span key={tech} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">{project.description || 'No description provided.'}</p>
          
          {/* Links */}
          <div className="mt-4 flex gap-4">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                GitHub →
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Demo →
              </a>
            )}
          </div>
        </section>

        {/* Development Log Entries */}
        <section>
          <h2 className="text-lg font-bold mb-6 uppercase tracking-wide">DEVELOPMENT LOG</h2>
          <div className="space-y-8">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <article key={entry.id} className="border-l-4 border-muted pl-6">
                  <div className="flex items-center gap-4 mb-3">
                    <time className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded" suppressHydrationWarning>
                      {formatDate(entry.created_at)}
                    </time>
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {formatTime(entry.created_at)}
                    </span>
                    {entry.entry_type && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        entry.entry_type === 'milestone' ? 'bg-blue-900/50 text-blue-300' :
                        entry.entry_type === 'feature' ? 'bg-green-900/50 text-green-300' :
                        entry.entry_type === 'bug_fix' ? 'bg-red-900/50 text-red-300' :
                        entry.entry_type === 'thoughts' ? 'bg-purple-900/50 text-purple-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {entry.entry_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-foreground font-bold mb-2">{entry.title}</h3>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {entry.content.split("\n").map((line, index) => (
                        <p key={index} className="mb-2">
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Display images if available */}
                    {entry.images && entry.images.length > 0 && (
                      <div className="mt-4">
                        <DevlogImageGallery 
                          images={entry.images} 
                          maxDisplay={3}
                        />
                      </div>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {entry.tags.map((tag: string) => (
                          <span key={tag} className="text-xs text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-muted-foreground italic">no devlog entries yet for this project.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}