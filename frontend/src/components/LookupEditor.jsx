import React, { useState } from 'react'
import { Plus, Trash2, Tag, Pencil, Check, X } from 'lucide-react'

/**
 * Reusable inline editor for an admin-managed lookup list.
 *
 * Props:
 *   title    - heading
 *   hint     - one-line helper under the heading
 *   items    - [{ id, name }, ...]
 *   onAdd    - async (name) => Promise<void>
 *   onDelete - async (id, name) => Promise<void>
 *   onRename - async (id, newName, oldName) => Promise<void>  (optional)
 */
export const LookupEditor = ({ title, hint, items, onAdd, onDelete, onRename, addPlaceholder }) => {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    onAdd(name)
    setDraft('')
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditDraft(item.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const saveEdit = (item) => {
    const name = editDraft.trim()
    if (!name || name === item.name) {
      cancelEdit()
      return
    }
    onRename?.(item.id, name, item.name)
    cancelEdit()
  }

  return (
    <div className="card-elevated">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="w-4 h-4 text-saffron-600" />
        <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      </div>
      {hint && <p className="muted text-xs mb-3">{hint}</p>}
      <form onSubmit={submit} className="flex gap-2 mb-3">
        <input
          className="input-field"
          placeholder={addPlaceholder || `Add a new ${title.toLowerCase().replace(/s$/, '')}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={64}
        />
        <button type="submit" className="btn btn-primary !px-3" disabled={!draft.trim()}>
          <Plus className="w-4 h-4" />
        </button>
      </form>
      {items.length === 0 ? (
        <p className="muted italic">None yet — add your first option above.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => {
            const isEditing = editingId === item.id
            return (
              <li
                key={item.id}
                className={`group inline-flex items-center gap-1 ${isEditing ? 'pl-2' : 'pl-3'} pr-1 py-1 rounded-full bg-ink-50 border border-ink-100 text-sm`}
              >
                {isEditing ? (
                  <>
                    <input
                      className="px-2 py-0.5 text-sm rounded-md border border-saffron-300 bg-white focus:outline-none focus:ring-2 focus:ring-saffron-500/30 min-w-[120px]"
                      value={editDraft}
                      autoFocus
                      maxLength={64}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEdit(item) }
                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(item)}
                      className="w-6 h-6 rounded-full hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-6 h-6 rounded-full hover:bg-ink-100 text-ink-500 flex items-center justify-center"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-ink-800">{item.name}</span>
                    {onRename && (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="w-6 h-6 rounded-full hover:bg-saffron-100 text-ink-400 hover:text-saffron-700 flex items-center justify-center"
                        title="Rename"
                        aria-label={`Rename ${item.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(item.id, item.name)}
                      className="w-6 h-6 rounded-full hover:bg-rose-100 text-ink-400 hover:text-rose-600 flex items-center justify-center"
                      title="Remove"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
