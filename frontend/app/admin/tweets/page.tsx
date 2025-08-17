'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, RefreshCw, Check, X, Calendar, Hash, Heart, Repeat2, MessageCircle, ExternalLink } from 'lucide-react'

interface Tweet {
  id: string
  tweet_id: string
  text: string
  author_username: string
  created_at: string
  imported_at: string
  assigned_project_id: string | null
  converted_to_devlog: boolean
  media_urls: string[]
  metrics: {
    like_count?: number
    retweet_count?: number
    reply_count?: number
    quote_count?: number
  }
  raw_data: any
}

interface Project {
  id: string
  name: string
  slug: string
  folder_id: string | null
}

interface Folder {
  id: string
  name: string
  slug: string
}

interface GroupedTweets {
  [date: string]: Tweet[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function TweetsAdminPage() {
  const [tweets, setTweets] = useState<GroupedTweets>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTweets, setSelectedTweets] = useState<Set<string>>(new Set())
  const [assigningProject, setAssigningProject] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tweetsRes, projectsRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/tweets/grouped`),
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/folders`)
      ])

      if (!tweetsRes.ok || !projectsRes.ok || !foldersRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [tweetsData, projectsData, foldersData] = await Promise.all([
        tweetsRes.json(),
        projectsRes.json(),
        foldersRes.json()
      ])

      setTweets(tweetsData)
      setProjects(projectsData)
      setFolders(foldersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const syncTweets = async () => {
    try {
      setSyncing(true)
      setError(null)
      
      const res = await fetch(`${API_URL}/tweets/sync`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('Failed to sync tweets')
      }

      const result = await res.json()
      
      // Refresh tweets after sync
      await fetchData()
      
      setError(`Synced successfully! Imported: ${result.imported}, Updated: ${result.updated}`)
      setTimeout(() => setError(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync tweets')
    } finally {
      setSyncing(false)
    }
  }

  const assignTweetToProject = async (tweetId: string, projectId: string | null) => {
    try {
      const res = await fetch(`${API_URL}/tweets/${tweetId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      })

      if (!res.ok) {
        throw new Error('Failed to assign tweet to project')
      }

      // Refresh tweets
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tweet')
    }
  }

  const convertToDevlog = async (tweetId: string) => {
    try {
      const res = await fetch(`${API_URL}/tweets/${tweetId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_type: 'thoughts' })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to convert tweet')
      }

      // Refresh tweets
      await fetchData()
      setError('Tweet converted to devlog successfully!')
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert tweet')
    }
  }

  const batchConvertToDevlog = async () => {
    if (selectedTweets.size === 0) {
      setError('No tweets selected')
      return
    }

    try {
      const res = await fetch(`${API_URL}/tweets/batch-convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tweet_ids: Array.from(selectedTweets),
          entry_type: 'thoughts' 
        })
      })

      if (!res.ok) {
        throw new Error('Failed to batch convert tweets')
      }

      const result = await res.json()
      
      // Clear selection and refresh
      setSelectedTweets(new Set())
      await fetchData()
      
      setError(`Converted ${result.converted} tweets to devlog!`)
      setTimeout(() => setError(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to batch convert')
    }
  }

  const toggleTweetSelection = (tweetId: string) => {
    const newSelection = new Set(selectedTweets)
    if (newSelection.has(tweetId)) {
      newSelection.delete(tweetId)
    } else {
      newSelection.add(tweetId)
    }
    setSelectedTweets(newSelection)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return 'Unknown'
    
    const folder = folders.find(f => f.id === project.folder_id)
    return folder ? `${folder.name}/${project.name}` : project.name
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header */}
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="relative overflow-hidden rounded-lg mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900"></div>
          <div className="relative z-10 py-8 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
                  <Image
                    src="/profile-avatar.jpg"
                    alt="Admin"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-0">TWEETS MANAGER</h1>
                  <p className="text-blue-200 text-sm -mt-0.5">import & convert tweets to devlog</p>
                </div>
              </div>
              <button
                onClick={syncTweets}
                disabled={syncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Tweets'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to admin
        </Link>

        {error && (
          <div className={`${error.includes('successfully') ? 'bg-green-900/20 border-green-500 text-green-300' : 'bg-red-900/20 border-red-500 text-red-300'} border px-4 py-2 rounded mb-6`}>
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 hover:opacity-80"
            >
              ✕
            </button>
          </div>
        )}

        {selectedTweets.size > 0 && (
          <div className="bg-blue-900/20 border border-blue-500 px-4 py-3 rounded mb-6 flex items-center justify-between">
            <span className="text-blue-300">
              {selectedTweets.size} tweet{selectedTweets.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTweets(new Set())}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={batchConvertToDevlog}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              >
                Convert Selected to Devlog
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading tweets...</p>
        ) : Object.keys(tweets).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(tweets)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, dateTweets]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Calendar className="w-5 h-5" />
                    {formatDate(date)}
                    <span className="text-sm text-muted-foreground font-normal">
                      ({dateTweets.length} tweet{dateTweets.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {dateTweets.map(tweet => (
                      <div 
                        key={tweet.id} 
                        className={`bg-muted/10 p-4 rounded border ${
                          tweet.converted_to_devlog ? 'border-green-500/30 bg-green-900/10' : 
                          tweet.assigned_project_id ? 'border-blue-500/30' : 
                          'border-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox for selection */}
                          {!tweet.converted_to_devlog && tweet.assigned_project_id && (
                            <input
                              type="checkbox"
                              checked={selectedTweets.has(tweet.id)}
                              onChange={() => toggleTweetSelection(tweet.id)}
                              className="mt-1"
                            />
                          )}
                          
                          <div className="flex-1">
                            {/* Tweet header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  @{tweet.author_username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(tweet.created_at)}
                                </span>
                                {tweet.converted_to_devlog && (
                                  <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
                                    Converted to Devlog
                                  </span>
                                )}
                              </div>
                              <a
                                href={`https://x.com/${tweet.author_username}/status/${tweet.tweet_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>

                            {/* Tweet content */}
                            <p className="text-sm mb-3 whitespace-pre-wrap">{tweet.text}</p>

                            {/* Media URLs */}
                            {tweet.media_urls && tweet.media_urls.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-muted-foreground mb-1">Media attached ({tweet.media_urls.length})</p>
                              </div>
                            )}

                            {/* Metrics */}
                            {tweet.metrics && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                {tweet.metrics.like_count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {tweet.metrics.like_count}
                                  </span>
                                )}
                                {tweet.metrics.retweet_count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Repeat2 className="w-3 h-3" />
                                    {tweet.metrics.retweet_count}
                                  </span>
                                )}
                                {tweet.metrics.reply_count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {tweet.metrics.reply_count}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {/* Project assignment */}
                              <select
                                value={tweet.assigned_project_id || ''}
                                onChange={(e) => assignTweetToProject(tweet.id, e.target.value || null)}
                                disabled={tweet.converted_to_devlog}
                                className="px-2 py-1 bg-background border border-muted rounded text-xs disabled:opacity-50"
                              >
                                <option value="">Select Project...</option>
                                {projects.map(project => {
                                  const folder = folders.find(f => f.id === project.folder_id)
                                  return (
                                    <option key={project.id} value={project.id}>
                                      {folder ? `${folder.name}/` : ''}{project.name}
                                    </option>
                                  )
                                })}
                              </select>

                              {/* Convert to devlog button */}
                              {tweet.assigned_project_id && !tweet.converted_to_devlog && (
                                <button
                                  onClick={() => convertToDevlog(tweet.id)}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                >
                                  Convert to Devlog
                                </button>
                              )}

                              {tweet.assigned_project_id && (
                                <span className="text-xs text-muted-foreground">
                                  → {getProjectName(tweet.assigned_project_id)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tweets imported yet</p>
            <button
              onClick={syncTweets}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Tweets from X
            </button>
          </div>
        )}
      </div>
    </div>
  )
}