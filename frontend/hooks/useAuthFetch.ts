'use client'

import { createClient } from '@/lib/supabase'

export function useAuthFetch() {
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    return headers
  }

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const authHeaders = await getAuthHeaders()
    
    return fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers
      }
    })
  }

  return { authFetch, getAuthHeaders }
}