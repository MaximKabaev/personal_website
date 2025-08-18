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
  MoreHorizontal
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
}

type ViewMode = 'list' | 'details' | 'icons'

export default function WindowsExplorer({ projects, folders }: Props) {
  const [currentPath, setCurrentPath] = useState<string[]>(['My Computer', 'Projects'])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null) // null means root level
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())

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

  const handleDoubleClick = (itemId: string, itemType: 'folder' | 'project') => {
    if (itemType === 'folder') {
      const folderId = itemId.replace('folder-', '')
      const folder = folders.find(f => f.id === folderId)
      
      // Navigate into the folder
      if (folder) {
        setCurrentFolderId(folderId)
        setCurrentPath(['My Computer', 'Projects', folder.name])
        // Also expand it in the tree
        handleFolderClick(folderId)
      }
    }
  }

  const handleBackNavigation = () => {
    if (currentFolderId !== null) {
      setCurrentFolderId(null)
      setCurrentPath(['My Computer', 'Projects'])
      setSelectedItems(new Set())
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
    <div className="bg-[#f0f0f0] border border-gray-400 rounded-sm shadow-md font-sans">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#0054e3] to-[#0041ac] text-white px-2 py-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4">
            <Folder className="w-full h-full" />
          </div>
          <span className="font-normal">Projects</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center">
            <Minus className="w-3 h-3 text-black" />
          </button>
          <button className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center">
            <Square className="w-2 h-2 text-black" />
          </button>
          <button className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] border border-gray-400 flex items-center justify-center">
            <X className="w-3 h-3 text-black" />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#ece9d8] border-b border-gray-400 px-2 py-1 text-sm">
        <div className="flex gap-6">
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer">File</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer">Edit</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer">View</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer">Tools</span>
          <span className="hover:bg-[#316ac5] hover:text-white px-2 py-1 cursor-pointer">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#ece9d8] border-b border-gray-400 px-2 py-1 flex items-center gap-2">
        <button 
          onClick={handleBackNavigation}
          disabled={currentFolderId === null}
          className={`p-1 hover:bg-[#316ac5] hover:text-white rounded-sm ${
            currentFolderId === null ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          disabled={true}
          className="p-1 opacity-50 cursor-not-allowed rounded-sm"
          title="Forward"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* Address Bar */}
        <div className="flex-1 mx-3">
          <div className="bg-white border border-gray-400 px-3 py-1 text-sm rounded-sm">
            <div className="flex items-center gap-1 text-gray-700">
              {currentPath.map((segment, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-gray-500" />}
                  <span>{segment}</span>
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
      <div className="flex" style={{ height: '400px' }}>
        {/* Left Sidebar - Navigation Tree */}
        <div className="w-1/3 bg-white border-r border-gray-400 p-2 overflow-auto">
          <div className="text-sm">
            <div className="flex items-center gap-1 py-1 hover:bg-blue-100 cursor-pointer">
              <Folder className="w-4 h-4 text-yellow-600" />
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
                      className="flex items-center gap-1 py-1 hover:bg-blue-100 cursor-pointer"
                    >
                      <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      {isOpen ? (
                        <FolderOpen className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Folder className="w-4 h-4 text-yellow-600" />
                      )}
                      <span>{folder.name}</span>
                    </div>
                    {isOpen && (
                      <div className="ml-6">
                        {folderProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-1 py-1 hover:bg-blue-100 cursor-pointer">
                            <FileText className="w-4 h-4 text-blue-600" />
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
        <div className="flex-1 bg-white overflow-auto">
          <div className="p-2">
            {viewMode === 'details' && (
              <div className="bg-[#ece9d8] border border-gray-400 mb-2">
                <div className="flex text-sm font-medium p-2 border-b border-gray-400">
                  <div className="flex-1">Name</div>
                  <div className="w-24">Status</div>
                  <div className="w-24">Type</div>
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
                    className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-blue-100 ${
                      isSelected ? 'bg-[#316ac5] text-white' : ''
                    } ${viewMode === 'icons' ? 'flex-col text-center' : ''}`}
                  >
                    <Folder className={`${viewMode === 'icons' ? 'w-8 h-8' : 'w-5 h-5'} text-yellow-600`} />
                    <div className={`flex-1 ${viewMode === 'icons' ? 'text-center' : ''}`}>
                      <span className="font-medium">{folder.name}</span>
                      {viewMode === 'details' && (
                        <div className="flex text-sm">
                          <div className="flex-1"></div>
                          <div className="w-24">-</div>
                          <div className="w-24">Folder</div>
                        </div>
                      )}
                    </div>
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
                    className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-blue-100 ${
                      isSelected ? 'bg-[#316ac5] text-white' : ''
                    } ${viewMode === 'icons' ? 'flex-col text-center' : ''}`}
                  >
                    <FileText className={`${viewMode === 'icons' ? 'w-8 h-8' : 'w-5 h-5'} text-blue-600`} />
                    <div className={`flex-1 ${viewMode === 'icons' ? 'text-center' : ''}`}>
                      <span className="font-medium">{project.name}</span>
                      {viewMode === 'details' && (
                        <div className="flex text-sm">
                          <div className="flex-1"></div>
                          <div className="w-24">{project.status}</div>
                          <div className="w-24">Project</div>
                        </div>
                      )}
                    </div>
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