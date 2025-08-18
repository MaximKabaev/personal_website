"use client"
import React, { useState } from "react"
import Link from "next/link"
import { 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FileText, 
  Minus,
  Square,
  X,
  ChevronLeft,
  ChevronUp,
  List,
  Grid,
  MoreHorizontal,
  RotateCcw
} from "lucide-react"

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
  onTitleBarMouseDown?: (e: React.MouseEvent) => void
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
  isMaximized?: boolean
}

type ViewMode = 'list' | 'details' | 'icons'

export default function WindowsExplorer({ 
  projects, 
  folders, 
  onTitleBarMouseDown, 
  onMinimize, 
  onMaximize, 
  onClose, 
  isMaximized = false
}: Props) {
  const [currentPath, setCurrentPath] = useState<string[]>(['My Computer', 'Projects'])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null) // null means root level
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [navigationHistory, setNavigationHistory] = useState<Array<{path: string[], folderId: string | null}>>([{path: ['My Computer', 'Projects'], folderId: null}])
  const [historyIndex, setHistoryIndex] = useState(0)

  const handleFolderClick = (folderId: string) => {
    const newOpenFolders = new Set(openFolders)
    if (newOpenFolders.has(folderId)) {
      newOpenFolders.delete(folderId)
    } else {
      newOpenFolders.add(folderId)
    }
    setOpenFolders(newOpenFolders)
  }

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.clear()
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const addToNavigationHistory = (path: string[], folderId: string | null) => {
    // Remove any forward history when navigating to a new location
    const newHistory = navigationHistory.slice(0, historyIndex + 1)
    newHistory.push({ path, folderId })
    setNavigationHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleDoubleClick = (itemId: string, itemType: 'folder' | 'project') => {
    if (itemType === 'folder') {
      const folderId = itemId.replace('folder-', '')
      const folder = folders.find(f => f.id === folderId)
      
      // Navigate into the folder
      if (folder) {
        const newPath = ['My Computer', 'Projects', folder.name]
        setCurrentFolderId(folderId)
        setCurrentPath(newPath)
        addToNavigationHistory(newPath, folderId)
        // Also expand it in the tree
        handleFolderClick(folderId)
      }
    }
  }

  const handleBackNavigation = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const historyItem = navigationHistory[newIndex]
      setCurrentFolderId(historyItem.folderId)
      setCurrentPath(historyItem.path)
      setHistoryIndex(newIndex)
      setSelectedItems(new Set())
    }
  }

  const handleForwardNavigation = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1
      const historyItem = navigationHistory[newIndex]
      setCurrentFolderId(historyItem.folderId)
      setCurrentPath(historyItem.path)
      setHistoryIndex(newIndex)
      setSelectedItems(new Set())
    }
  }

  const handlePathSegmentClick = (segmentIndex: number) => {
    if (segmentIndex === 0 || segmentIndex === 1) {
      // Clicked on "My Computer" or "Projects" - go to root
      const newPath = ['My Computer', 'Projects']
      setCurrentFolderId(null)
      setCurrentPath(newPath)
      addToNavigationHistory(newPath, null)
      setSelectedItems(new Set())
    } else if (segmentIndex === 2 && currentPath.length === 3) {
      // Clicked on folder name when we're inside it - do nothing (already there)
      return
    }
  }

  // Get items to display in right pane based on current location
  const getCurrentDisplayItems = () => {
    if (currentFolderId === null) {
      // Show root level - all folders and root projects
      return {
        folders: folders,
        projects: projects.filter(p => !p.folder_id)
      }
    } else {
      // Show contents of specific folder
      return {
        folders: [], // No subfolders for now
        projects: projects.filter(p => p.folder_id === currentFolderId)
      }
    }
  }

  const displayItems = getCurrentDisplayItems()

  const totalItems = displayItems.folders.length + displayItems.projects.length

  return (
    <div className="bg-[#f0f0f0] dark:bg-[#2d2d30] border border-gray-400 dark:border-gray-600 rounded-sm font-sans h-full w-full overflow-hidden flex flex-col">
      {/* Title Bar */}
      <div 
        className="bg-gradient-to-r from-[#0054e3] to-[#0041ac] text-white px-2 py-1 flex items-center justify-between text-sm cursor-move select-none"
        onMouseDown={onTitleBarMouseDown}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-4 h-4">
            <Folder className="w-full h-full" />
          </div>
          <span className="font-normal">Projects</span>
        </div>
        <div className="flex items-center gap-1 pointer-events-auto">
          <button 
            className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center"
            onClick={onMinimize}
          >
            <Minus className="w-3 h-3 text-black" />
          </button>
          <button 
            className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center"
            onClick={onMaximize}
          >
            {isMaximized ? (
              <div className="w-2 h-2 border border-black"></div>
            ) : (
              <Square className="w-2 h-2 text-black" />
            )}
          </button>
          <button 
            className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center"
            onClick={onClose}
          >
            <X className="w-3 h-3 text-black" />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#ece9d8] dark:bg-[#3c3c3c] border-b border-gray-400 dark:border-gray-600 px-2 py-1 text-sm">
        <div className="flex gap-6">
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer text-black dark:text-gray-200">File</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer text-black dark:text-gray-200">Edit</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer text-black dark:text-gray-200">View</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer text-black dark:text-gray-200">Tools</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer text-black dark:text-gray-200">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#ece9d8] dark:bg-[#3c3c3c] border-b border-gray-400 dark:border-gray-600 px-2 py-1 flex items-center gap-2">
        <button 
          onClick={handleBackNavigation}
          disabled={historyIndex <= 0}
          className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${
            historyIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleForwardNavigation}
          disabled={historyIndex >= navigationHistory.length - 1}
          className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${
            historyIndex >= navigationHistory.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* Address Bar */}
        <div className="flex-1 mx-3">
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-400 dark:border-gray-600 px-3 py-1 text-sm rounded-sm">
            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 overflow-hidden">
              {currentPath.map((segment, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />}
                  <span 
                    className="hover:underline cursor-pointer hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis"
                    onClick={() => handlePathSegmentClick(index)}
                    title={segment}
                  >
                    {segment}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${viewMode === 'list' ? 'bg-[#316ac5] text-white' : ''}`}
            title="List"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('details')}
            className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${viewMode === 'details' ? 'bg-[#316ac5] text-white' : ''}`}
            title="Details"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('icons')}
            className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${viewMode === 'icons' ? 'bg-[#316ac5] text-white' : ''}`}
            title="Icons"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Navigation Tree */}
        <div className="w-1/3 bg-white dark:bg-[#252526] border-r border-gray-400 dark:border-gray-600 p-2 overflow-auto">
          <div className="text-sm text-black dark:text-gray-200">
            <div className="flex items-center gap-1 py-1 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
              <Folder className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium">Projects</span>
            </div>
            <div className="ml-4 mt-1">
              {folders.map((folder) => {
                const isOpen = openFolders.has(folder.id)
                const folderProjects = projects.filter(p => p.folder_id === folder.id)
                
                return (
                  <div key={folder.id}>
                    <div 
                      onClick={() => handleFolderClick(folder.id)}
                      className="flex items-center gap-1 py-1 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer"
                    >
                      <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''} text-gray-600 dark:text-gray-400`} />
                      {isOpen ? (
                        <FolderOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                      <span>{folder.name}</span>
                    </div>
                    {isOpen && (
                      <div className="ml-6">
                        {folderProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-1 py-1 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm">{project.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Pane - File Listing */}
        <div className="flex-1 bg-white dark:bg-[#1e1e1e] overflow-auto">
          <div className="p-2">
            {viewMode === 'details' && (
              <div className="bg-[#ece9d8] dark:bg-[#3c3c3c] border border-gray-400 dark:border-gray-600 mb-2">
                <div className="flex text-sm font-medium p-2 border-b border-gray-400 dark:border-gray-600 text-black dark:text-gray-200">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-5"></div> {/* Space for icon */}
                    <span>Name</span>
                  </div>
                  <div className="w-24 text-center">Status</div>
                  <div className="w-24 text-center">Type</div>
                </div>
              </div>
            )}
            
            <div className={`${viewMode === 'icons' ? 'grid grid-cols-4 gap-4' : 'space-y-1'}`}>
              {displayItems.folders.map((folder) => {
                const folderProjects = projects.filter(p => p.folder_id === folder.id)
                const isSelected = selectedItems.has(`folder-${folder.id}`)
                
                return (
                  <div
                    key={folder.id}
                    onClick={() => handleItemSelect(`folder-${folder.id}`)}
                    onDoubleClick={() => handleDoubleClick(`folder-${folder.id}`, 'folder')}
                    className={`flex items-center gap-3 p-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#316ac5] text-white hover:bg-[#316ac5] hover:text-white' 
                        : 'text-black dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800'
                    } ${viewMode === 'icons' ? 'flex-col text-center' : ''}`}
                  >
                    <Folder className={`${viewMode === 'icons' ? 'w-8 h-8' : 'w-5 h-5'} text-yellow-600 dark:text-yellow-400`} />
                    {viewMode === 'details' ? (
                      <>
                        <div className="flex-1">
                          <span className="font-medium">{folder.name}</span>
                        </div>
                        <div className="w-24 text-center text-sm">-</div>
                        <div className="w-24 text-center text-sm">Folder</div>
                      </>
                    ) : (
                      <div className={`flex-1 ${viewMode === 'icons' ? 'text-center' : ''}`}>
                        <span className="font-medium">{folder.name}</span>
                      </div>
                    )}
                    {viewMode === 'list' && (
                      <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
                        {folderProjects.length} items
                      </span>
                    )}
                  </div>
                )
              })}

              {displayItems.projects.map((project) => {
                const isSelected = selectedItems.has(`project-${project.id}`)
                
                return (
                  <Link
                    key={project.id}
                    href={currentFolderId ? `/projects/${folders.find(f => f.id === currentFolderId)?.slug}/${project.slug}` : `/projects/${project.slug}`}
                    onClick={() => handleItemSelect(`project-${project.id}`)}
                    className={`flex items-center gap-3 p-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#316ac5] text-white hover:bg-[#316ac5] hover:text-white' 
                        : 'text-black dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800'
                    } ${viewMode === 'icons' ? 'flex-col text-center' : ''}`}
                  >
                    <FileText className={`${viewMode === 'icons' ? 'w-8 h-8' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
                    {viewMode === 'details' ? (
                      <>
                        <div className="flex-1">
                          <span className="font-medium">{project.name}</span>
                        </div>
                        <div className="w-24 text-center text-sm">{project.status}</div>
                        <div className="w-24 text-center text-sm">Project</div>
                      </>
                    ) : (
                      <div className={`flex-1 ${viewMode === 'icons' ? 'text-center' : ''}`}>
                        <span className="font-medium">{project.name}</span>
                      </div>
                    )}
                    {viewMode === 'list' && (
                      <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
                        {project.status}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#ece9d8] border-t border-gray-400 px-2 py-1 text-sm text-gray-700 flex items-center justify-between">
        <span>{totalItems} object{totalItems !== 1 ? 's' : ''}</span>
        <span>My Computer</span>
      </div>
    </div>
  )
}