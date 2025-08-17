import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase configuration missing - auth will be disabled')
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

/**
 * Middleware to verify Supabase JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip auth in development if Supabase is not configured
  if (!supabase && process.env.NODE_ENV === 'development') {
    console.warn('Auth middleware: Skipping authentication (Supabase not configured)')
    return next()
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Authentication service not configured' })
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

/**
 * Middleware for routes that should be protected in production
 * but accessible in development
 */
export const protectRoute = (req: Request, res: Response, next: NextFunction) => {
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
  next()
}

/**
 * Middleware to strictly require authentication
 * Use this for sensitive operations
 */
export const requireAuth = authenticateToken