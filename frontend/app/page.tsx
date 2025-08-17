import Link from "next/link"
import Image from "next/image"
import { getProjects, getFolderTree } from "@/lib/api"
import ClientThemeToggle from "@/components/ClientThemeToggle"
import ClientOnlyTree from "@/components/ClientOnlyTree"
import ClientOnlyWhoami from "@/components/ClientOnlyWhoami"
import { TerminalSequenceProvider } from "@/components/TerminalSequence"
import ClientOnlyFinger from "@/components/ClientOnlyFinger"

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

  return (
    <div
      className="min-h-screen bg-background text-foreground font-mono"
      style={{ ['--bg-pos' as string]: 'center 50%' }}
    >
      {/* Header with cover image */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div
            className="absolute inset-0 bg-cover bg-[url('/landing-cover.jpg')] dark:bg-[url('/landing-cover-dark.jpg')] dark:[--bg-pos:center_22%]"
            style={{ backgroundPosition: 'var(--bg-pos)' }}
          ></div>
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
                  <h1 className="text-2xl font-bold text-white mb-0">MAXIM KABAEV</h1>
                  <p className="text-slate-300 text-sm -mt-0.5">software & aerospace engineer</p>
                </div>
              </div>
              <ClientThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <TerminalSequenceProvider>
          {/* About Section */}
          <section className="mb-12">
            <ClientOnlyWhoami />
          </section>

          {/* Projects Section */}
          <section className="mb-12">
            <ClientOnlyTree projects={projects} folders={folders} />
          </section>

          {/* Contact Section */}
          <section>
            <ClientOnlyFinger />
          </section>
        </TerminalSequenceProvider>
      </div>
    </div>
  )
}
