"use client"

import React from "react"
import { MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Project = {
  name: string
  description: string | null
  status: string
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
}

type Props = {
  projects: Project[]
  variant?: "header" | "mobile"
}

function buildPrompt(projects: Project[]): string {
  const projectLines = projects
    .map((p) => {
      const tech = p.tech_stack?.length ? ` [${p.tech_stack.join(", ")}]` : ""
      const desc = p.description ? ` — ${p.description}` : ""
      return `- ${p.name}${tech} (${p.status})${desc}`
    })
    .join("\n")

  return `You are answering questions about Maxim Kabaev, an aerospace engineering student at the University of Bath who also does software development (mostly self-taught). He is passionate about building things, constantly exploring new ideas, and driven by the belief that with enough experiments, after enough startup fails, at least one will succeed.

## Projects
${projectLines}

## Contact
- X/Twitter: @MaximKabaev21

---

The user wants to learn more about Maxim. Answer their questions based on the context above. If you don't know something, say so rather than making it up.`
}

function ChatGPTIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 2406 2406" fill="currentColor" className={className}>
      <path id="a" d="M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z"/>
      <use xlinkHref="#a" transform="rotate(60 1203 1203)"/>
      <use xlinkHref="#a" transform="rotate(120 1203 1203)"/>
      <use xlinkHref="#a" transform="rotate(180 1203 1203)"/>
      <use xlinkHref="#a" transform="rotate(240 1203 1203)"/>
      <use xlinkHref="#a" transform="rotate(300 1203 1203)"/>
    </svg>
  )
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"/>
    </svg>
  )
}

function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
    </svg>
  )
}

const AI_TARGETS = [
  {
    name: "ChatGPT",
    Icon: ChatGPTIcon,
    buildUrl: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: "Claude",
    Icon: ClaudeIcon,
    buildUrl: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: "Gemini",
    Icon: GeminiIcon,
    buildUrl: (prompt: string) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
]

export default function PromptMe({ projects, variant = "header" }: Props) {
  const handleClick = (target: (typeof AI_TARGETS)[number]) => {
    const prompt = buildPrompt(projects)
    window.open(target.buildUrl(prompt), "_blank", "noopener,noreferrer")
  }

  const isHeader = variant === "header"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isHeader ? (
          <button
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors mt-0.5"
            title="Ask AI about me"
          >
            <MessageSquare className="w-3 h-3" />
            prompt me
          </button>
        ) : (
          <button className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-md transition-colors">
            <MessageSquare className="w-3 h-3 text-white" />
            <span className="text-xs text-white">Prompt me</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {AI_TARGETS.map((target) => (
          <DropdownMenuItem
            key={target.name}
            onClick={() => handleClick(target)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <target.Icon className="w-4 h-4" />
            <span>{target.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
