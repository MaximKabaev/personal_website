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

const AI_TARGETS = [
  {
    name: "ChatGPT",
    icon: "/ai-icons/chatgpt.svg",
    buildUrl: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: "Claude",
    icon: "/ai-icons/claude.svg",
    buildUrl: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: "Gemini",
    icon: "/ai-icons/gemini.svg",
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
            className="flex items-center gap-1.5 text-xs text-white hover:text-slate-200 transition-colors"
            title="Ask AI about me"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            prompt me
          </button>
        ) : (
          <button className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-md transition-colors">
            <MessageSquare className="w-3 h-3 text-white" />
            <span className="text-xs text-white">Prompt me</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {AI_TARGETS.map((target) => (
          <DropdownMenuItem
            key={target.name}
            onClick={() => handleClick(target)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src={target.icon}
              alt={target.name}
              className="w-4 h-4"
            />
            <span>{target.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
