'use client'

export function useAuthFetch() {
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const authHeaders = getAuthHeaders()

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
