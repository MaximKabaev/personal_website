"use client"
import React, { useState, useRef, useEffect } from "react"
import WindowsExplorer from "./WindowsExplorer"
import { RotateCcw } from "lucide-react"

type Project = {
  id: string
  name: string
  slug: string
  status: string
  folder_id: string | null
  description?: string
}

type FolderType = {
  id: string
  name: string
  slug: string
}

type Props = {
  projects: Project[]
  folders: FolderType[]
  onReloadStateChange?: (showReload: boolean, reloadFn: () => void) => void
}

type WindowState = {
  x: number
  y: number
  width: number
  height: number
  isMinimized: boolean
  isMaximized: boolean
  isVisible: boolean
}

export default function WindowsDesktop({ projects, folders, onReloadStateChange }: Props) {
  const [windowState, setWindowState] = useState<WindowState>({
    x: 20,
    y: 20,
    width: 0, // Will be set dynamically
    height: 0, // Will be set dynamically
    isMinimized: false,
    isMaximized: false,
    isVisible: true
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, windowX: 0, windowY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, windowX: 0, windowY: 0 })
  const [showReloadButton, setShowReloadButton] = useState(false)
  const [explorerKey, setExplorerKey] = useState(0)
  
  const desktopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set initial window size to fill most of the desktop
    if (desktopRef.current) {
      const rect = desktopRef.current.getBoundingClientRect()
      const desktopWidth = rect.width || 1000
      const desktopHeight = rect.height || 600
      
      setWindowState(prev => ({
        ...prev,
        width: Math.max(desktopWidth - 40, 800), // Leave 20px margin on each side
        height: Math.max(desktopHeight - 40, 500) // Leave 20px margin on top and bottom
      }))
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault()
    setShowReloadButton(true)
    onReloadStateChange?.(true, handleReloadExplorer)
    
    if (action === 'drag') {
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        windowX: windowState.x,
        windowY: windowState.y
      })
    } else if (action === 'resize' && handle) {
      setIsResizing(true)
      setResizeHandle(handle)
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: windowState.width,
        height: windowState.height,
        windowX: windowState.x,
        windowY: windowState.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const desktopRect = desktopRef.current?.getBoundingClientRect()
      if (desktopRect) {
        // Allow window to move anywhere within the desktop container bounds
        const newX = Math.max(-windowState.width + 50, Math.min(dragStart.windowX + deltaX, desktopRect.width - 50))
        const newY = Math.max(0, Math.min(dragStart.windowY + deltaY, desktopRect.height - 100))
        
        setWindowState(prev => ({ ...prev, x: newX, y: newY }))
      }
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.windowX
      let newY = resizeStart.windowY
      
      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(400, resizeStart.width + deltaX)
          newHeight = Math.max(300, resizeStart.height + deltaY)
          break
        case 'sw': // bottom-left
          newWidth = Math.max(400, resizeStart.width - deltaX)
          newHeight = Math.max(300, resizeStart.height + deltaY)
          newX = resizeStart.windowX + deltaX
          break
        case 'ne': // top-right
          newWidth = Math.max(400, resizeStart.width + deltaX)
          newHeight = Math.max(300, resizeStart.height - deltaY)
          newY = resizeStart.windowY + deltaY
          break
        case 'nw': // top-left
          newWidth = Math.max(400, resizeStart.width - deltaX)
          newHeight = Math.max(300, resizeStart.height - deltaY)
          newX = resizeStart.windowX + deltaX
          newY = resizeStart.windowY + deltaY
          break
        case 'n': // top
          newHeight = Math.max(300, resizeStart.height - deltaY)
          newY = resizeStart.windowY + deltaY
          break
        case 's': // bottom
          newHeight = Math.max(300, resizeStart.height + deltaY)
          break
        case 'w': // left
          newWidth = Math.max(400, resizeStart.width - deltaX)
          newX = resizeStart.windowX + deltaX
          break
        case 'e': // right
          newWidth = Math.max(400, resizeStart.width + deltaX)
          break
      }
      
      setWindowState(prev => ({
        ...prev,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }

  const handleMinimize = () => {
    setWindowState(prev => ({ ...prev, isMinimized: true, isVisible: false }))
  }

  const handleMaximize = () => {
    if (windowState.isMaximized) {
      // Restore to previous size, or calculate if first time
      const desktopWidth = desktopRef.current?.getBoundingClientRect().width || 1000
      const desktopHeight = desktopRef.current?.getBoundingClientRect().height || 600
      setWindowState(prev => ({ 
        ...prev, 
        isMaximized: false, 
        x: 20, 
        y: 20, 
        width: Math.max(desktopWidth - 40, 800), 
        height: Math.max(desktopHeight - 40, 500) 
      }))
    } else {
      const desktopWidth = desktopRef.current?.getBoundingClientRect().width || 1000
      const desktopHeight = desktopRef.current?.getBoundingClientRect().height || 600
      setWindowState(prev => ({ 
        ...prev, 
        isMaximized: true, 
        x: 0, 
        y: 0, 
        width: desktopWidth, 
        height: desktopHeight 
      }))
    }
  }

  const handleClose = () => {
    setWindowState(prev => ({ ...prev, isVisible: false }))
  }

  const handleReloadExplorer = () => {
    // Reset explorer content
    setExplorerKey(prev => prev + 1)
    setShowReloadButton(false)
    onReloadStateChange?.(false, handleReloadExplorer)
    
    // Reset window position and size to initial values
    if (desktopRef.current) {
      const rect = desktopRef.current.getBoundingClientRect()
      const desktopWidth = rect.width || 1000
      const desktopHeight = rect.height || 600
      
      setWindowState({
        x: 20,
        y: 20,
        width: Math.max(desktopWidth - 40, 800),
        height: Math.max(desktopHeight - 40, 500),
        isMinimized: false,
        isMaximized: false,
        isVisible: true // Ensure it's visible
      })
    }
    
    // Reset any drag/resize states
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }

  const getCursorStyle = (handle: string): string => {
    switch (handle) {
      case 'n':
      case 's':
        return 'cursor-ns-resize'
      case 'e':
      case 'w':
        return 'cursor-ew-resize'
      case 'ne':
      case 'sw':
        return 'cursor-nesw-resize'
      case 'nw':
      case 'se':
        return 'cursor-nw-resize'
      default:
        return ''
    }
  }

  if (!windowState.isVisible || windowState.width === 0 || windowState.height === 0) {
    return (
      <div 
        ref={desktopRef}
        className="min-h-[600px] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.05'%3e%3ccircle cx='30' cy='30' r='2'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`
        }}
      />
    )
  }

  return (
    <div 
      ref={desktopRef}
      className="min-h-[600px] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.05'%3e%3ccircle cx='30' cy='30' r='2'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Windows Explorer Window */}
      <div
        className="absolute"
        style={{
          left: windowState.x,
          top: windowState.y,
          width: windowState.width,
          height: windowState.height,
          zIndex: 10
        }}
      >
        {/* Resize Handles */}
        <div className={`absolute top-0 left-0 w-2 h-2 ${getCursorStyle('nw')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')} />
        <div className={`absolute top-0 right-0 w-2 h-2 ${getCursorStyle('ne')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')} />
        <div className={`absolute bottom-0 left-0 w-2 h-2 ${getCursorStyle('sw')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')} />
        <div className={`absolute bottom-0 right-0 w-2 h-2 ${getCursorStyle('se')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')} />
        <div className={`absolute top-0 left-2 right-2 h-2 ${getCursorStyle('n')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')} />
        <div className={`absolute bottom-0 left-2 right-2 h-2 ${getCursorStyle('s')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 's')} />
        <div className={`absolute left-0 top-2 bottom-2 w-2 ${getCursorStyle('w')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')} />
        <div className={`absolute right-0 top-2 bottom-2 w-2 ${getCursorStyle('e')}`} onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')} />

        {/* Window Content */}
        <div className="w-full h-full">
          <WindowsExplorer 
            key={explorerKey}
            projects={projects} 
            folders={folders}
            onTitleBarMouseDown={(e) => handleMouseDown(e, 'drag')}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            isMaximized={windowState.isMaximized}
          />
        </div>
      </div>
    </div>
  )
}