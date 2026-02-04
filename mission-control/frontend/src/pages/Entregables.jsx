import { useState, useEffect, useCallback } from 'react'

const API = '/api'
function api(url, opts = {}) {
  const token = localStorage.getItem('mc_token')
  const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...opts.headers }
  return fetch(API + url, { ...opts, headers }).then(r => r.json())
}

const CATEGORIES = ['all', 'threads', 'reports', 'docs', 'exports', 'other']
const CATEGORY_COLORS = {
  threads: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  reports: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
  docs: 'bg-green-500/20 text-green-400 border-green-500/30',
  exports: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const CATEGORY_ICONS = {
  threads: '🧵',
  reports: '📊',
  docs: '📄',
  exports: '📤',
  other: '📁'
}

function timeAgo(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

function EntregableCard({ entregable, onView, onEdit, onDelete, compact = false }) {
  return (
    <div className="bg-surface border border-card rounded-lg p-4 hover:bg-card/30 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[entregable.category]}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text truncate">{entregable.title}</h3>
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{entregable.description}</p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
          <button onClick={() => onView(entregable)} className="text-xs text-highlight px-1.5 py-0.5 rounded hover:bg-highlight/10">View</button>
          <button onClick={() => onEdit(entregable)} className="text-xs text-yellow-400 px-1.5 py-0.5 rounded hover:bg-yellow-400/10">Edit</button>
          <button onClick={() => onDelete(entregable)} className="text-xs text-red-400 px-1.5 py-0.5 rounded hover:bg-red-400/10">×</button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[entregable.category] || CATEGORY_COLORS.other}`}>
            {entregable.category}
          </span>
          {entregable.tags?.length > 0 && (
            <div className="flex gap-1">
              {entregable.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="text-xs bg-accent/30 text-muted px-1.5 py-0.5 rounded">{tag}</span>
              ))}
              {entregable.tags.length > 2 && <span className="text-xs text-muted">+{entregable.tags.length - 2}</span>}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted">{entregable.createdBy}</div>
          <div className="text-xs text-muted">{timeAgo(entregable.createdAt)}</div>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ entregable, content, onClose }) {
  const isMarkdown = entregable.filePath.endsWith('.md')
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface border border-card rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-card">
          <div>
            <h2 className="text-lg font-semibold text-text">{entregable.title}</h2>
            <p className="text-sm text-muted">{entregable.filePath}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">×</button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm text-text whitespace-pre-wrap leading-relaxed font-mono bg-card/30 rounded-lg p-4">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}

function EditModal({ entregable, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: entregable?.title || '',
    description: entregable?.description || '',
    category: entregable?.category || 'other',
    tags: entregable?.tags?.join(', ') || ''
  })
  
  const handleSave = () => {
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface border border-card rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-card">
          <h2 className="text-lg font-semibold text-text">Edit Entregable</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-xl">×</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Title</label>
            <input 
              value={formData.title}
              onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
              className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
              className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors h-20 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted mb-1">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}
              className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors"
            >
              {CATEGORIES.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-muted mb-1">Tags (comma-separated)</label>
            <input 
              value={formData.tags}
              onChange={e => setFormData(prev => ({...prev, tags: e.target.value}))}
              placeholder="tag1, tag2, tag3"
              className="w-full bg-card border border-accent rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="bg-highlight text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-highlight/80 transition-all">
              Save
            </button>
            <button onClick={onClose} className="bg-card text-muted px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Entregables() {
  const [entregables, setEntregables] = useState([])
  const [filteredEntregables, setFilteredEntregables] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingEntregable, setViewingEntregable] = useState(null)
  const [viewingContent, setViewingContent] = useState('')
  const [editingEntregable, setEditingEntregable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gridView, setGridView] = useState(true)

  const loadEntregables = useCallback(async () => {
    try {
      const data = await api('/entregables')
      setEntregables(data.entregables || [])
    } catch (e) {
      console.error('Failed to load entregables:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadEntregables() }, [])

  // Filter entregables
  useEffect(() => {
    let filtered = entregables
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        e.createdBy.toLowerCase().includes(query)
      )
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    setFilteredEntregables(filtered)
  }, [entregables, selectedCategory, searchQuery])

  const handleView = async (entregable) => {
    try {
      const data = await api(`/entregables/${entregable.id}/content`)
      setViewingContent(data.content)
      setViewingEntregable(entregable)
    } catch (e) {
      alert('Failed to load file content')
    }
  }

  const handleEdit = (entregable) => {
    setEditingEntregable(entregable)
  }

  const handleSaveEdit = async (updatedData) => {
    try {
      await api(`/entregables/${editingEntregable.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedData)
      })
      setEditingEntregable(null)
      loadEntregables()
    } catch (e) {
      alert('Failed to update entregable')
    }
  }

  const handleDelete = async (entregable) => {
    if (!confirm(`Delete "${entregable.title}" from the list?\n\nThis won't delete the actual file.`)) return
    
    try {
      await api(`/entregables/${entregable.id}`, { method: 'DELETE' })
      loadEntregables()
    } catch (e) {
      alert('Failed to delete entregable')
    }
  }

  const categoryStats = CATEGORIES.slice(1).reduce((acc, cat) => {
    acc[cat] = entregables.filter(e => e.category === cat).length
    return acc
  }, {})

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted">Loading entregables...</div>
  }

  return (
    <div className="h-full overflow-auto p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Entregables</h1>
          <p className="text-sm text-muted">Curated deliverables and important documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setGridView(!gridView)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${gridView ? 'bg-highlight text-white' : 'bg-card text-muted hover:text-text'}`}
          >
            {gridView ? '⋮⋮⋮' : '☰'}
          </button>
          <div className="text-sm text-muted bg-card px-3 py-1.5 rounded-lg">
            {filteredEntregables.length} of {entregables.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by title, description, tags, or creator..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-card border border-accent rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-highlight transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const count = cat === 'all' ? entregables.length : categoryStats[cat] || 0
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedCategory === cat 
                    ? 'bg-highlight text-white' 
                    : 'bg-card text-muted hover:text-text hover:bg-accent'
                }`}
              >
                {cat !== 'all' && <span>{CATEGORY_ICONS[cat]}</span>}
                <span>{cat}</span>
                <span className="text-xs opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {filteredEntregables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-text mb-2">No entregables found</h3>
          <p className="text-muted">
            {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters' : 'No deliverables have been added yet'}
          </p>
        </div>
      ) : (
        <div className={gridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredEntregables.map(entregable => (
            <EntregableCard
              key={entregable.id}
              entregable={entregable}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              compact={!gridView}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {viewingEntregable && (
        <ViewModal
          entregable={viewingEntregable}
          content={viewingContent}
          onClose={() => setViewingEntregable(null)}
        />
      )}

      {editingEntregable && (
        <EditModal
          entregable={editingEntregable}
          onSave={handleSaveEdit}
          onClose={() => setEditingEntregable(null)}
        />
      )}
    </div>
  )
}