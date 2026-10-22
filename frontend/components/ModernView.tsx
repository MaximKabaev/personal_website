"use client"
import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Mail, Copy, Check } from "lucide-react"

type Project = {
  id: string
  name: string
  slug: string
  status: string
  folder_id: string | null
  description?: string
  tech_stack?: string[]
  github_url?: string
  demo_url?: string
}

type FolderType = {
  id: string
  name: string
  slug: string
  children?: FolderType[]
}

type Props = {
  projects: Project[]
  folders: FolderType[]
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    archived: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  }
  const c = colors[status] || colors.active
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${c}`}>
      {status}
    </span>
  )
}

function ProjectCard({ project, folder, index }: { project: Project; folder?: FolderType; index: number }) {
  const { ref, inView } = useInView(0.1)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = React.useState({ rotateX: 0, rotateY: 0 })
  const [isHovered, setIsHovered] = React.useState(false)
  const href = folder ? `/projects/${folder.slug}/${project.slug}` : `/projects/${project.slug}`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({
      rotateX: (0.5 - y) * 12,
      rotateY: (x - 0.5) * 12,
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ rotateX: 0, rotateY: 0 })
  }

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${index * 80}ms`,
      }}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(600px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)${isHovered ? ' translateY(-4px)' : ''}`,
          transition: 'transform 0.15s ease-out',
        }}
      >
      <Link href={href} className="group block relative">
        {/* Gradient border on hover */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-violet-500/50 group-hover:via-fuchsia-500/50 group-hover:to-cyan-500/50 transition-all duration-500 blur-[1px]" />

        <div className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-500 group-hover:border-transparent group-hover:shadow-xl group-hover:shadow-violet-500/5 dark:group-hover:shadow-violet-500/10">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-fuchsia-500 transition-all duration-300">
              {project.name}
            </h3>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <StatusPill status={project.status} />
            {folder && (
              <span className="text-xs text-muted-foreground/60">
                {folder.name}
              </span>
            )}
          </div>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/50">
              {project.tech_stack.slice(0, 5).map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                >
                  {tech}
                </span>
              ))}
              {project.tech_stack.length > 5 && (
                <span className="text-[11px] px-2 py-0.5 text-muted-foreground/50">
                  +{project.tech_stack.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      </div>
    </div>
  )
}

function FolderSection({ folder, projects, startIndex }: { folder: FolderType; projects: Project[]; startIndex: number }) {
  const folderProjects = projects.filter(p => p.folder_id === folder.id)
  const { ref, inView } = useInView(0.1)

  if (folderProjects.length === 0) return null

  return (
    <div ref={ref} className="mb-12">
      <div
        className={`flex items-center gap-3 mb-6 transition-all duration-700 ease-out ${
          inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
        }`}
      >
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {folder.name}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {folderProjects.map((project, i) => (
          <ProjectCard key={project.id} project={project} folder={folder} index={startIndex + i} />
        ))}
      </div>
    </div>
  )
}

export default function ModernView({ projects, folders }: Props) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Trigger hero animation after mount
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [])

  const rootProjects = projects.filter(p => !p.folder_id)
  const allFolders = flattenFolders(folders)

  // Count projects for stagger index
  let projectIndex = 0

  return (
    <div className="relative">
      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03] dark:opacity-[0.06] blur-[100px]"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
            left: mousePos.x * 0.02 - 100,
            top: mousePos.y * 0.02 - 100,
            transition: "left 2s ease-out, top 2s ease-out",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] dark:opacity-[0.06] blur-[100px] animate-float-slow"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent 70%)",
            right: -100,
            top: 200,
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full opacity-[0.02] dark:opacity-[0.04] blur-[100px] animate-float-slow-reverse"
          style={{
            background: "radial-gradient(circle, #f472b6, transparent 70%)",
            left: -50,
            bottom: 100,
          }}
        />
      </div>

      {/* Hero / About */}
      <section ref={heroRef} className="mb-16 relative">
        <div
          className={`transition-all duration-1000 ease-out ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Building things
            </span>
            <br />
            <span className="text-foreground">that matter.</span>
          </h2>
        </div>
        <div
          className={`transition-all duration-1000 delay-300 ease-out ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            hi. im maxim, an aerospace engineering student at the university of bath with a strong
            background in software development (mostly self-taught). i'm passionate about building
            things, constantly exploring new ideas, and driven by the belief that with enough
            experiments, after enough fails, at least one will succeed — it's simple statistics, you just gotta keep trying.
          </p>
        </div>

        {/* Animated line */}
        <div
          className={`h-px mt-10 bg-gradient-to-r from-violet-500/50 via-fuchsia-500/30 to-transparent transition-all duration-1500 ease-out ${
            heroVisible ? "opacity-100 scale-x-100 origin-left" : "opacity-0 scale-x-0 origin-left"
          }`}
          style={{ transitionDelay: "600ms" }}
        />
      </section>

      {/* Projects */}
      <section className="mb-16">
        <SectionTitle text="Projects" />

        {/* Root projects */}
        {rootProjects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 mb-12">
            {rootProjects.map((project) => {
              const card = <ProjectCard key={project.id} project={project} index={projectIndex} />
              projectIndex++
              return card
            })}
          </div>
        )}

        {/* Folder sections */}
        {allFolders.map((folder) => {
          const folderProjects = projects.filter(p => p.folder_id === folder.id)
          const section = (
            <FolderSection
              key={folder.id}
              folder={folder}
              projects={projects}
              startIndex={projectIndex}
            />
          )
          projectIndex += folderProjects.length
          return section
        })}
      </section>

      {/* Contact */}
      <ContactSection />

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-30px) translateX(15px); }
          66% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(20px) translateX(-15px); }
          66% { transform: translateY(-25px) translateX(10px); }
        }
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .animate-float-slow-reverse {
          animation: float-slow-reverse 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

function SectionTitle({ text }: { text: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`flex items-center gap-4 mb-8 transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <h2 className="text-2xl font-bold text-foreground">{text}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
  )
}

function ContactSection() {
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="pb-4">
      <SectionTitle text="Get in Touch" />
      <div
        className={`transition-all duration-700 delay-200 ease-out ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-muted-foreground mb-6 text-lg">
          Always open to discuss anything — my DMs are open.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://twitter.com/MaximKabaev21"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium transition-all duration-300 hover:border-transparent hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5"
          >
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-violet-500/40 group-hover:via-fuchsia-500/40 group-hover:to-cyan-500/40 transition-all duration-500 blur-[1px]" />
            <span className="relative text-lg">𝕏</span>
            <ArrowUpRight className="relative w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
          <EmailCopyButton />
        </div>
      </div>
    </section>
  )
}

function EmailCopyButton() {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("mkabaevuk@gmail.com")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium transition-all duration-300 hover:border-transparent hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5">
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-violet-500/40 group-hover:via-fuchsia-500/40 group-hover:to-cyan-500/40 transition-all duration-500 blur-[1px]" />
      <Mail className="relative w-4 h-4" />
      <span className="relative">mkabaevuk@gmail.com</span>
      <button
        onClick={handleCopy}
        className="relative p-1 rounded-md hover:bg-muted transition-colors"
        title="Copy email"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    </div>
  )
}

function flattenFolders(folders: FolderType[]): FolderType[] {
  const result: FolderType[] = []
  for (const f of folders) {
    result.push(f)
    if (f.children && f.children.length > 0) {
      result.push(...flattenFolders(f.children))
    }
  }
  return result
}
