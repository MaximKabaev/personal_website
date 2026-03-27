import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string }
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for API key first (read-only access)
    const apiKey = req.headers['x-api-key'] as string
    if (apiKey && apiKey === process.env.API_KEY) {
      return next()
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }

    // Attach user to request object
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

/**
 * Middleware for routes that should be protected in production
 * but accessible in development
 */
export const protectRoute = (req: Request, res: Response, next: NextFunction) => {
  // Check for API key (read-only access)
  const apiKey = req.headers['x-api-key'] as string
  if (apiKey && apiKey === process.env.API_KEY) {
    return next()
  }

  // In production, always require authentication
  if (process.env.NODE_ENV === 'production') {
    return authenticateToken(req, res, next)
  }

  // In development, check if auth header is present
  // If present, validate it; if not, allow access
  const authHeader = req.headers.authorization
  if (authHeader) {
    return authenticateToken(req, res, next)
  }

  // No auth header in development - allow access
  console.warn(`Auth middleware: Allowing unauthenticated access to ${req.path} (development mode)`)
  return next()
}

/**
 * Middleware to strictly require authentication
 * Use this for sensitive operations
 */
export const requireAuth = authenticateToken
