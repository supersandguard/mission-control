import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { workspaceApi } from '../api'

// ── Language detection for syntax hints ──────────────────
function getLang(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase()
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', rs: 'rust', go: 'go',
    json: 'json', yml: 'yaml', yaml: 'yaml', toml: 'toml',
    md: 'markdown', mdx: 'markdown', txt: 'text',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    html: 'html', htm: 'html', css: 'css', scss: 'css',
    sql: 'sql', graphql: 'graphql',
    env: 'env', gitignore: 'text', dockerfile: 'docker',
  }
  return map[ext] || 'text'
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fileIcon(name, type) {
  if (type === 'directory') return '📁'
  const ext = name.split('.').pop()?.toLowerCase()
  const icons = {
    md: '📝', json: '🔧', js: '⚡', jsx: '⚛️', ts: '🔷', tsx: '🔷',
    py: '🐍', sh: '🐚', yml: '📋', yaml: '📋', toml: '📋',
    html: '🌐', css: '🎨', sql: '🗃️', env: '🔒', txt: '📄',
    gitignore: '👁️', log: '📜',
  }
  return icons[ext] || '📄'
}

// ── Tree Node Component ──────────────────────────────────
function TreeNode({ node, depth = 0, selectedPath, onSelect, expandedDirs, onToggleDir, searchQuery }) {
  const isDir = node.type === 'directory'
  const isSelected = node.path === selectedPath
  const isExpanded = expandedDirs.has(node.path)

  // Filter logic for search
  const matchesSearch = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase())
  const hasMatchingChildren = isDir && node.children?.some(child => {
    if (child.name.toLowerCase().includes(searchQuery.toLowerCase())) return true
    if (child.type === 'directory') return child.children?.some(gc => gc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return false
  })

  if (searchQuery && !matchesSearch && !hasMatchingChildren) return null

  const handleClick = () => {
    if (isDir) {
      onToggleDir(node.path)
    } else {
      onSelect(node)
    }
  }

  const showExpanded = isDir && (isExpanded || (searchQuery && hasMatchingChildren))

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-all group hover:bg-card/50 rounded-md ${
          isSelected ? 'bg-highlight/15 text-highlight' : 'text-text'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {isDir && (
          <span className="text-muted text-[10px] w-3 flex-shrink-0 transition-transform" style={{
            transform: showExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>▶</span>
        )}
        {!isDir && <span className="w-3 flex-shrink-0" />}
        <span className="text-sm flex-shrink-0">{fileIcon(node.name, node.type)}</span>
        <span className={`truncate flex-1 ${isDir ? 'font-medium' : ''}`}>
          {node.name}
        </span>
        {!isDir && node.size !== undefined && (
          <span className="text-[10px] text-muted/50 flex-shrink-0 hidden group-hover:inline">
            {formatSize(node.size)}
          </span>
        )}
      </button>
      {isDir && showExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Breadcrumb Component ─────────────────────────────────
function Breadcrumb({ filePath, onNavigate }) {
  if (!filePath) return null
  const parts = filePath.split('/')
  return (
    <div className="flex items-center gap-1 text-xs text-muted overflow-x-auto flex-shrink-0">
      <button onClick={() => onNavigate(null)} className="hover:text-highlight transition-colors flex-shrink-0">
        ~/clawd
      </button>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1 flex-shrink-0">
          <span className="text-muted/40">/</span>
          {i < parts.length - 1 ? (
            <button
              onClick={() => onNavigate(parts.slice(0, i + 1).join('/'))}
              className="hover:text-highlight transition-colors"
            >
              {part}
            </button>
          ) : (
            <span className="text-text font-medium">{part}</span>
          )}
        </span>
      ))}
    </div>
  )
}

// ── New File Modal ───────────────────────────────────────
function NewFileModal({ basePath, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError('')
    const filePath = basePath ? `${basePath}/${name.trim()}` : name.trim()
    try {
      await onCreate(filePath)
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to create file')
    }
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleCreate}
        className="bg-surface border border-card rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold text-text mb-1">New File</h3>
        <p className="text-xs text-muted mb-4">
          {basePath ? `Create in: ${basePath}/` : 'Create in workspace root'}
        </p>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="filename.md"
          className="w-full bg-card border border-accent rounded-lg px-4 py-2.5 text-text text-sm focus:outline-none focus:border-highlight mb-3"
        />
        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-text transition-colors">Cancel</button>
          <button type="submit" disabled={creating || !name.trim()}
            className="bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── File Editor Component ────────────────────────────────
function FileEditorPanel({ file, onSave, onClose }) {
  const [content, setContent] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    loadFile()
  }, [file.path])

  const loadFile = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await workspaceApi.getFile(file.path)
      setContent(data.content || '')
      setOriginal(data.content || '')
    } catch (e) {
      setError(e.message || 'Failed to load file')
    }
    setLoading(false)
  }

  const saveFile = async () => {
    setSaving(true)
    try {
      await workspaceApi.saveFile(file.path, content)
      setOriginal(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (onSave) onSave()
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (content !== original) saveFile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [content, original])

  // Handle tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      setContent(content.substring(0, start) + '  ' + content.substring(end))
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }
  }

  const hasChanges = content !== original
  const lang = getLang(file.name)
  const lineCount = content.split('\n').length

  return (
    <div className="h-full flex flex-col">
      {/* Editor header */}
      <div className="shrink-0 bg-surface border-b border-card px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onClose} className="text-muted hover:text-text text-sm flex-shrink-0 md:hidden">✕</button>
          <span className="text-lg flex-shrink-0">{fileIcon(file.name, 'file')}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm truncate">{file.name}</h3>
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span>{lang}</span>
              <span>{lineCount} lines</span>
              <span>{formatSize(file.size)}</span>
              {file.modified && <span className="hidden sm:inline">{formatDate(file.modified)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && <span className="text-green-400 text-xs">✓ Saved</span>}
          {hasChanges && <span className="text-yellow-400 text-[10px] hidden sm:inline">unsaved</span>}
          <button onClick={saveFile} disabled={saving || !hasChanges}
            className="bg-highlight hover:bg-highlight/80 disabled:opacity-40 text-white px-3 py-1.5 rounded text-xs font-medium transition-all">
            {saving ? '...' : '⌘S Save'}
          </button>
        </div>
      </div>

      {/* Editor body */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted text-sm">Loading...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">⚠️ {error}</p>
            <button onClick={loadFile} className="text-xs text-highlight hover:underline">Retry</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Line numbers */}
          <div className="hidden sm:block w-12 bg-surface border-r border-card/50 py-3 overflow-hidden select-none flex-shrink-0">
            <div className="font-mono text-[11px] text-muted/30 leading-[1.425rem] text-right pr-2">
              {Array.from({ length: Math.min(lineCount, 9999) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-background text-text font-mono text-[13px] leading-[1.425rem] p-3 resize-none focus:outline-none"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      )}
    </div>
  )
}

// ── Main Files Page ──────────────────────────────────────
export default function Files() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [expandedDirs, setExpandedDirs] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewFile, setShowNewFile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [treeError, setTreeError] = useState('')

  const loadTree = useCallback(async () => {
    try {
      setTreeError('')
      const data = await workspaceApi.getTree()
      setTree(data.tree || [])
    } catch (e) {
      setTreeError(e.message || 'Failed to load')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadTree() }, [loadTree])

  const toggleDir = useCallback((dirPath) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }, [])

  const handleSelectFile = useCallback((node) => {
    setSelectedFile(node)
    // On mobile, close sidebar when file selected
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  const handleCreateFile = async (filePath) => {
    await workspaceApi.createFile(filePath)
    await loadTree()
    setSelectedFile({ path: filePath, name: filePath.split('/').pop(), type: 'file', size: 0 })
  }

  // Navigate breadcrumb: expand directory path
  const handleBreadcrumbNav = (dirPath) => {
    if (!dirPath) {
      setSelectedFile(null)
      return
    }
    // Expand the directory
    setExpandedDirs(prev => {
      const next = new Set(prev)
      const parts = dirPath.split('/')
      for (let i = 1; i <= parts.length; i++) {
        next.add(parts.slice(0, i).join('/'))
      }
      return next
    })
  }

  // Get current directory for new file context
  const currentDir = selectedFile
    ? selectedFile.type === 'directory' ? selectedFile.path : selectedFile.path.split('/').slice(0, -1).join('/')
    : ''

  // Count files in tree
  const countFiles = (nodes) => {
    let count = 0
    for (const n of nodes) {
      if (n.type === 'file') count++
      if (n.children) count += countFiles(n.children)
    }
    return count
  }
  const totalFiles = useMemo(() => countFiles(tree), [tree])

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / File Tree */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 lg:w-80 bg-surface border-r border-card shrink-0 overflow-hidden`}>
        {/* Sidebar header */}
        <div className="shrink-0 px-4 py-3 border-b border-card/50">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📁</span>
              <h3 className="font-semibold text-text text-sm">Explorer</h3>
              <span className="text-[10px] text-muted bg-card px-1.5 py-0.5 rounded">{totalFiles}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowNewFile(true)}
                className="text-muted hover:text-highlight p-1 rounded hover:bg-card/50 transition-all text-sm" title="New file">
                ＋
              </button>
              <button onClick={loadTree}
                className="text-muted hover:text-highlight p-1 rounded hover:bg-card/50 transition-all text-sm" title="Refresh">
                ↻
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-card border border-accent/50 rounded-md px-3 py-1.5 pl-7 text-xs text-text placeholder-muted/50 focus:outline-none focus:border-highlight/50 transition-colors"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/40 text-[10px]">🔍</span>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-auto py-1">
          {loading ? (
            <div className="text-center text-muted text-sm py-8">Loading tree...</div>
          ) : treeError ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm mb-2">⚠️ {treeError}</p>
              <button onClick={loadTree} className="text-xs text-highlight hover:underline">Retry</button>
            </div>
          ) : (
            tree.map(node => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                selectedPath={selectedFile?.path}
                onSelect={handleSelectFile}
                expandedDirs={expandedDirs}
                onToggleDir={toggleDir}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedFile ? (
          <>
            {/* Breadcrumb bar */}
            <div className="shrink-0 bg-surface/50 border-b border-card/30 px-4 py-1.5 flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-muted hover:text-text text-sm"
              >
                {sidebarOpen ? '◀' : '☰'}
              </button>
              <Breadcrumb filePath={selectedFile.path} onNavigate={handleBreadcrumbNav} />
            </div>
            <FileEditorPanel
              file={selectedFile}
              onSave={loadTree}
              onClose={() => { setSelectedFile(null); setSidebarOpen(true) }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-muted hover:text-text text-lg mb-4 block mx-auto"
              >
                ☰ Show Files
              </button>
              <div className="text-4xl mb-3 opacity-20">📂</div>
              <p className="text-muted text-sm mb-1">Select a file to view or edit</p>
              <p className="text-muted/50 text-xs">{totalFiles} files in workspace</p>
              <button onClick={() => setShowNewFile(true)}
                className="mt-4 text-xs text-highlight hover:text-highlight/80 transition-colors">
                + Create new file
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showNewFile && (
        <NewFileModal
          basePath={currentDir}
          onClose={() => setShowNewFile(false)}
          onCreate={handleCreateFile}
        />
      )}
    </div>
  )
}
