export interface DevlogEntry {
  id: string
  project_id: string
  title: string
  content: string
  timestamp: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

// Original mock data structure for internal use
export interface OriginalDevlogEntry {
  id: string
  timestamp: string
  description: string
  details?: string
  comments?: string
}

export interface OriginalProject {
  id: string
  title: string
  description: string
  entries: OriginalDevlogEntry[]
}

export const projects: OriginalProject[] = [
  {
    id: "personal-website",
    title: "Personal Website",
    description:
      "A modern personal website built with Next.js and Tailwind CSS. Features a clean design with dark mode support and responsive layout.",
    entries: [
      {
        id: "1",
        timestamp: "2024-01-15T10:30:00Z",
        description: "Initial setup and design planning",
        details:
          "Set up Next.js project with TypeScript and Tailwind CSS. Created basic layout structure and planned the overall design approach.",
        comments:
          "Decided to go with a minimalist approach inspired by terminal aesthetics. The monospace font gives it a nice developer feel.",
      },
      {
        id: "2",
        timestamp: "2024-01-16T14:20:00Z",
        description: "Implemented responsive navigation and hero section",
        details:
          "Added mobile-responsive navigation with smooth transitions. Created hero section with animated background and professional headshot.",
        comments:
          "The hero section took longer than expected, but the animated background really makes it stand out. Mobile responsiveness was tricky but worth it.",
      },
      {
        id: "3",
        timestamp: "2024-01-17T09:15:00Z",
        description: "Added project showcase and contact form",
        details:
          "Built project cards with hover effects and modal previews. Integrated contact form with email validation and success states.",
        comments:
          "Really happy with how the project cards turned out. The hover effects add a nice touch of interactivity without being overwhelming.",
      },
    ],
  },
  {
    id: "task-manager",
    title: "Task Manager App",
    description:
      "A full-stack task management application with real-time updates, user authentication, and collaborative features.",
    entries: [
      {
        id: "1",
        timestamp: "2024-01-10T16:45:00Z",
        description: "Database schema design and API planning",
        details:
          "Designed PostgreSQL schema for users, projects, tasks, and comments. Planned REST API endpoints and authentication flow.",
        comments:
          "Spent a lot of time thinking about the data relationships. Decided to keep it simple for v1 and add complexity later.",
      },
      {
        id: "2",
        timestamp: "2024-01-12T11:30:00Z",
        description: "User authentication and authorization system",
        details:
          "Implemented JWT-based auth with refresh tokens. Added role-based permissions and password reset functionality.",
        comments:
          "Authentication is always more complex than it seems. Had to debug some token refresh issues but got it working smoothly.",
      },
    ],
  },
  {
    id: "weather-dashboard",
    title: "Weather Dashboard",
    description:
      "A beautiful weather dashboard with location-based forecasts, interactive maps, and historical data visualization.",
    entries: [
      {
        id: "1",
        timestamp: "2024-01-08T13:20:00Z",
        description: "API integration and data fetching setup",
        details:
          "Integrated OpenWeatherMap API for current weather and forecasts. Set up location services and error handling.",
        comments:
          "The weather API has some quirks with the data format, but once I figured out the structure it was smooth sailing.",
      },
    ],
  },
]
