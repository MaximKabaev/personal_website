"use client"
import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { FileSystem } from "@/lib/fileSystem"

type Props = {
  projects: any[]
  folders: any[]
  onReady?: () => void
  commandRef?: React.MutableRefObject<((command: string, autoExecute?: boolean) => void) | null>
}

type TerminalLine = {
  type: 'command' | 'output' | 'error'
  content: string
}

export default function TerminalEmulator({ projects, folders, onReady, commandRef }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileSystem] = useState(() => new FileSystem(projects, folders))
  
  // Load saved state from session storage
  const [currentPath, setCurrentPath] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('terminalPath')
    return saved ? JSON.parse(saved) : ['usr', 'maxim']
  })
  
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('commandHistory')
    return saved ? JSON.parse(saved) : []
  })
  
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>(() => {
    const saved = sessionStorage.getItem('terminalHistory')
    return saved ? JSON.parse(saved) : []
  })
  
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState("")
  const [completionOptions, setCompletionOptions] = useState<string[]>([])
  const [showCompletions, setShowCompletions] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    onReady?.()
    
    // Expose setCommand and executeCommand functions
    if (commandRef) {
      commandRef.current = (command: string, autoExecute: boolean = false) => {
        setCurrentCommand(command)
        inputRef.current?.focus()
        if (autoExecute) {
          // Execute the command after a brief delay to show it being typed
          setTimeout(() => {
            executeCommand(command)
          }, 100)
        }
      }
    }
  }, [onReady, commandRef])

  // Save state to session storage when it changes
  useEffect(() => {
    sessionStorage.setItem('terminalPath', JSON.stringify(currentPath))
  }, [currentPath])

  useEffect(() => {
    sessionStorage.setItem('commandHistory', JSON.stringify(commandHistory))
  }, [commandHistory])

  useEffect(() => {
    sessionStorage.setItem('terminalHistory', JSON.stringify(terminalHistory))
  }, [terminalHistory])

  const getPrompt = () => {
    const path = currentPath.join('/')
    return path
  }

  const addToTerminal = (line: TerminalLine) => {
    setTerminalHistory(prev => [...prev, line])
  }

  const executeCommand = (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    // Hide completions when executing
    setShowCompletions(false)
    setCompletionOptions([])

    // Add command to history (we'll handle formatting in the render)
    addToTerminal({ type: 'command', content: `${getPrompt()}|$|${trimmed}` })
    setCommandHistory(prev => [...prev, trimmed])
    setHistoryIndex(-1)

    // Parse command
    const parts = trimmed.split(' ').filter(Boolean)
    const command = parts[0]
    const args = parts.slice(1)

    switch (command) {
      case 'pwd':
        handlePwd()
        break
      case 'ls':
        handleLs(args[0])
        break
      case 'cd':
        handleCd(args[0] || '~')
        break
      case 'clear':
        setTerminalHistory([])
        sessionStorage.removeItem('terminalHistory') // Also clear from storage
        break
      case 'nano':
        if (args[0]) {
          handleFileNavigation(args[0])
        } else {
          addToTerminal({ type: 'error', content: 'nano: missing file operand' })
        }
        break
      case 'cat':
        if (args[0]) {
          handleCat(args[0])
        } else {
          addToTerminal({ type: 'error', content: 'cat: missing file operand' })
        }
        break
      case 'help':
        handleHelp()
        break
      case 'quit':
        handleQuit()
        break
      default:
        // Check if it's a file navigation command
        if (!handleFileNavigation(command)) {
          addToTerminal({ type: 'error', content: `command not found: ${command}` })
        }
    }

    setCurrentCommand("")
  }

  const handlePwd = () => {
    addToTerminal({ type: 'output', content: `/${currentPath.join('/')}` })
  }

  const handleLs = (path?: string) => {
    let targetPath = currentPath

    if (path) {
      const resolved = fileSystem.resolvePath(currentPath, path)
      if (!resolved) {
        addToTerminal({ type: 'error', content: `ls: cannot access '${path}': No such file or directory` })
        return
      }
      targetPath = resolved
    }

    const items = fileSystem.list(targetPath)
    if (items.length === 0) {
      addToTerminal({ type: 'output', content: '' })
    } else {
      const output = items.map(item => 
        item.type === 'directory' ? `${item.name}/` : item.name
      ).join('  ')
      addToTerminal({ type: 'output', content: output })
    }
  }

  const handleCd = (path: string) => {
    // Handle home directory shortcuts
    if (path === '~' || path === '~/' || path === '') {
      setCurrentPath(['usr', 'maxim'])
      return
    }
    
    // Replace ~/ at the beginning of path with home directory
    if (path.startsWith('~/')) {
      path = path.slice(2) // Remove ~/ and treat rest as relative to home
      setCurrentPath(['usr', 'maxim']) // First go home
      if (!path) return // If just ~/, we're done
    }

    const resolved = fileSystem.resolvePath(currentPath, path)
    if (!resolved) {
      addToTerminal({ type: 'error', content: `cd: no such file or directory: ${path}` })
      return
    }

    const node = fileSystem.getNode(resolved)
    if (node?.type === 'file') {
      // If it's a project file, navigate to it instead of showing error
      const url = fileSystem.getProjectUrl(node)
      if (url) {
        addToTerminal({ type: 'output', content: `cd: '${path}' is a project file, opening...` })
        setTimeout(() => router.push(url), 500)
      } else {
        addToTerminal({ type: 'error', content: `cd: not a directory: ${path}` })
      }
      return
    }

    setCurrentPath(resolved)
  }

  const handleFileNavigation = (path: string): boolean => {
    // Remove ./ prefix if present
    const cleanPath = path.startsWith('./') ? path.slice(2) : path

    // Try to resolve the path
    const resolved = fileSystem.resolvePath(currentPath, cleanPath)
    if (!resolved) {
      return false
    }

    const node = fileSystem.getNode(resolved)
    if (!node || node.type !== 'file') {
      return false
    }

    const url = fileSystem.getProjectUrl(node)
    if (url) {
      addToTerminal({ type: 'output', content: `Opening ${node.name}...` })
      setTimeout(() => router.push(url), 500)
      return true
    }

    return false
  }

  const handleCat = (path: string) => {
    // Remove ./ prefix if present
    const cleanPath = path.startsWith('./') ? path.slice(2) : path

    // Try to resolve the path
    const resolved = fileSystem.resolvePath(currentPath, cleanPath)
    if (!resolved) {
      addToTerminal({ type: 'error', content: `cat: ${path}: No such file or directory` })
      return
    }

    const node = fileSystem.getNode(resolved)
    if (!node) {
      addToTerminal({ type: 'error', content: `cat: ${path}: No such file or directory` })
      return
    }

    if (node.type === 'directory') {
      addToTerminal({ type: 'error', content: `cat: ${path}: Is a directory` })
      return
    }

    // Display project metadata
    if (node.metadata) {
      const project = node.metadata
      const lines = [
        `File: ${project.name}`,
        `Type: Project`,
        ''
      ]

      if (project.description) {
        lines.push('Description:')
        lines.push(project.description)
        lines.push('')
      }

      if (project.status) {
        lines.push(`Status: ${project.status}`)
      }

      if (project.tech_stack && project.tech_stack.length > 0) {
        lines.push(`Tech Stack: ${project.tech_stack.join(', ')}`)
      }

      if (project.github_url) {
        lines.push(`GitHub: ${project.github_url}`)
      }

      if (project.demo_url) {
        lines.push(`Demo: ${project.demo_url}`)
      }

      lines.forEach(line => addToTerminal({ type: 'output', content: line }))
    } else {
      addToTerminal({ type: 'output', content: `${node.name}: No metadata available` })
    }
  }

  const handleHelp = () => {
    const helpText = [
      'Available commands:',
      '  pwd              - print working directory',
      '  ls [path]        - list directory contents',
      '  cd [path]        - change directory',
      '  cd ..            - go up one directory',
      '  cat [file]       - display project information',
      '  clear            - clear terminal',
      '  quit             - exit',
      '  help             - show this help',
      '',
      'To open the project page:',
      '  cd [filename]       - open project',
      '  cd [path to filename]     - open project (relative)',
      '',
      'Use arrow keys to navigate command history',
      'Use Tab key for auto-completion'
    ]
    helpText.forEach(line => addToTerminal({ type: 'output', content: line }))
  }

  const handleQuit = () => {
    addToTerminal({ type: 'output', content: 'Goodbye!' })
    setTimeout(() => {
      // Clear all session storage
      sessionStorage.removeItem('terminalHistory')
      sessionStorage.removeItem('terminalPath')
      sessionStorage.removeItem('commandHistory')
      sessionStorage.removeItem('animationShown')
      
      // Clear dev/normal mode selection
      localStorage.removeItem('isDev')
      
      // Redirect to blank page
      window.location.href = 'about:blank'
    }, 500)
  }

  const getCompletions = (partial: string): string[] => {
    const parts = partial.split(' ')
    const lastPart = parts[parts.length - 1]
    
    // If first word, complete commands
    if (parts.length === 1) {
      const commands = ['pwd', 'ls', 'cd', 'clear', 'help', 'nano', 'cat', 'quit']
      return commands.filter(cmd => cmd.startsWith(lastPart))
    }
    
    // Otherwise complete files/directories
    const items = fileSystem.list(currentPath)
    const names = items.map(item => 
      item.type === 'directory' ? item.name + '/' : item.name
    )
    
    // If the last part contains a path separator, handle path completion
    if (lastPart.includes('/')) {
      const pathParts = lastPart.split('/')
      const prefix = pathParts.slice(0, -1).join('/') + '/'
      const searchTerm = pathParts[pathParts.length - 1]
      
      // Try to resolve the path up to the last segment
      const partialPath = pathParts.slice(0, -1).join('/')
      const resolved = fileSystem.resolvePath(currentPath, partialPath)
      
      if (resolved) {
        const dirItems = fileSystem.list(resolved)
        return dirItems
          .map(item => prefix + item.name + (item.type === 'directory' ? '/' : ''))
          .filter(name => name.startsWith(lastPart))
      }
    }
    
    return names.filter(name => name.startsWith(lastPart))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      // Don't complete on empty input
      if (!currentCommand.trim()) return
      
      // Get possible completions
      const completions = getCompletions(currentCommand)
      
      if (completions.length === 0) {
        setShowCompletions(false)
        return
      }
      
      if (completions.length === 1) {
        // Single completion - apply it
        const parts = currentCommand.split(' ')
        parts[parts.length - 1] = completions[0]
        setCurrentCommand(parts.join(' '))
        setShowCompletions(false)
        setCompletionOptions([])
      } else {
        // Multiple completions - show them
        setCompletionOptions(completions)
        setShowCompletions(true)
        
        // Find common prefix
        const commonPrefix = completions.reduce((prefix, current) => {
          let i = 0
          while (i < prefix.length && i < current.length && prefix[i] === current[i]) {
            i++
          }
          return prefix.slice(0, i)
        })
        
        // If there's a longer common prefix than what's typed, complete to that
        const parts = currentCommand.split(' ')
        const lastPart = parts[parts.length - 1]
        if (commonPrefix.length > lastPart.length) {
          parts[parts.length - 1] = commonPrefix
          setCurrentCommand(parts.join(' '))
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setShowCompletions(false)
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowCompletions(false)
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCurrentCommand("")
        } else {
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[newIndex])
        }
      }
    } else if (e.key === 'Enter') {
      executeCommand(currentCommand)
    } else if (e.key === 'Escape') {
      setShowCompletions(false)
      setCompletionOptions([])
    } else {
      // Hide completions on typing
      if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
        setShowCompletions(false)
      }
    }
  }

  return (
    <div className="font-mono text-sm">
      {/* Terminal history */}
      {terminalHistory.map((line, i) => {
        if (line.type === 'command') {
          // Parse command line to apply colors
          const parts = line.content.split('|')
          if (parts.length === 3) {
            const [path, dollar, command] = parts
            return (
              <div key={i} className="text-foreground">
                <span className="text-blue-500 dark:text-white mr-1">{path}</span>
                <span className="text-muted-foreground mr-1">{dollar}</span>
                <span>{command}</span>
              </div>
            )
          }
        }
        
        return (
          <div 
            key={i} 
            className={
              line.type === 'error' ? 'text-red-500' : 
              line.type === 'command' ? 'text-foreground' : 
              'text-muted-foreground'
            }
          >
            {line.content}
          </div>
        )
      })}
      
      {/* Current input line */}
      <div>
        <div className="flex items-center">
          <span className="text-blue-500 dark:text-white mr-1">{getPrompt()}</span>
          <span className="text-muted-foreground mr-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <span
            className="ml-1 inline-block w-[2px] h-[1em] bg-current animate-pulse"
            style={{ verticalAlign: 'text-bottom', transform: 'translateY(-0.18em)' }}
          />
        </div>
        
        {/* Completion options */}
        {showCompletions && completionOptions.length > 0 && (
          <div className="mt-1 ml-4 text-muted-foreground">
            {completionOptions.map((option, i) => (
              <span key={i} className="mr-4">
                {option}
                {option.endsWith('/') ? '' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}