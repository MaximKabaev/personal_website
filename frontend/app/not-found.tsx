import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-6">PAGE NOT FOUND</h2>
        <p className="text-muted-foreground mb-8">the page you're looking for doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded hover:bg-primary/90 transition-colors"
        >
          return home
        </Link>
      </div>
    </div>
  )
}
