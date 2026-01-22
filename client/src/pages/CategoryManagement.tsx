import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, type CategoryWithNominees } from '../api/api'

function CategoryManagement() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryWithNominees[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // Edit category
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  // New nominee form
  const [addingNomineeToCategoryId, setAddingNomineeToCategoryId] = useState<number | null>(null)
  const [newNomineeName, setNewNomineeName] = useState('')

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkImportJson, setBulkImportJson] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        await api.auth.me()
        await loadCategories()
      } catch {
        navigate('/login')
      }
    }
    checkAuthAndLoad()
  }, [navigate])

  const loadCategories = async () => {
    try {
      const data = await api.category.getAll()
      setCategories(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setAddingCategory(true)
    setError('')
    try {
      await api.category.create(newCategoryName.trim())
      setNewCategoryName('')
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAddingCategory(false)
    }
  }

  const handleUpdateCategory = async (id: number) => {
    if (!editCategoryName.trim()) return

    setError('')
    try {
      await api.category.update(id, editCategoryName.trim())
      setEditingCategoryId(null)
      setEditCategoryName('')
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}" and all its nominees?`)) return

    setError('')
    try {
      await api.category.delete(id)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddNominee = async (categoryId: number) => {
    if (!newNomineeName.trim()) return

    setError('')
    try {
      await api.category.addNominee(categoryId, newNomineeName.trim())
      setAddingNomineeToCategoryId(null)
      setNewNomineeName('')
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteNominee = async (categoryId: number, nomineeId: number, name: string) => {
    if (!confirm(`Delete nominee "${name}"?`)) return

    setError('')
    try {
      await api.category.deleteNominee(categoryId, nomineeId)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSetWinner = async (categoryId: number, nomineeId: number) => {
    setError('')
    try {
      await api.category.setWinner(categoryId, nomineeId)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleClearWinner = async (categoryId: number) => {
    setError('')
    try {
      await api.category.clearWinner(categoryId)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const newOrder = [...categories]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, moved)

    setError('')
    try {
      const orderedIds = newOrder.map(c => c.id)
      await api.category.reorder(orderedIds)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBulkImport = async () => {
    setError('')
    setBulkImporting(true)

    try {
      const parsed = JSON.parse(bulkImportJson)

      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of categories')
      }

      const result = await api.category.bulkImport(parsed)
      alert(`Successfully imported ${result.categoriesCreated} categories with ${result.nomineesCreated} nominees!`)
      setBulkImportJson('')
      setShowBulkImport(false)
      await loadCategories()
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.')
      } else {
        setError(err.message)
      }
    } finally {
      setBulkImporting(false)
    }
  }

  if (loading) {
    return <div className="container loading">Loading...</div>
  }

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1>Category Management</h1>
        <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Add Category Form */}
      <div className="card mb-3">
        <h2>Add New Category</h2>
        <form onSubmit={handleAddCategory} className="flex gap-2" style={{ marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="e.g., Best Picture"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={addingCategory}>
            {addingCategory ? 'Adding...' : 'Add Category'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowBulkImport(!showBulkImport)}
          >
            {showBulkImport ? 'Hide Bulk Import' : 'Bulk Import from JSON'}
          </button>
        </div>
      </div>

      {/* Bulk Import Section */}
      {showBulkImport && (
        <div className="card mb-3">
          <h2>Bulk Import Categories</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Paste JSON in the format below to import multiple categories and nominees at once:
          </p>
          <pre style={{
            background: 'var(--bg-light)',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            overflow: 'auto',
            marginBottom: '1rem'
          }}>
{`[
  {
    "name": "Best Picture",
    "nominees": ["Film A", "Film B", "Film C"]
  },
  {
    "name": "Best Director",
    "nominees": ["Director A", "Director B"]
  }
]`}
          </pre>
          <textarea
            value={bulkImportJson}
            onChange={(e) => setBulkImportJson(e.target.value)}
            placeholder="Paste your JSON here..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}
          />
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkImportJson.trim()}
            >
              {bulkImporting ? 'Importing...' : 'Import Categories'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setBulkImportJson('')
                setShowBulkImport(false)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="card">
          <p className="text-muted">No categories yet. Add your first Oscar category above!</p>
        </div>
      ) : (
        categories.map((category, index) => (
          <div key={category.id} className="card mb-2">
            <div className="flex-between mb-2">
              {editingCategoryId === category.id ? (
                <div className="flex gap-2" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateCategory(category.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingCategoryId(null)
                      setEditCategoryName('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: 0 }}>
                    {category.name}
                    {category.winner_id ? (
                      <span className="badge badge-winner" style={{ marginLeft: '0.5rem' }}>
                        Winner Set
                      </span>
                    ) : null}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-secondary"
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingCategoryId(category.id)
                        setEditCategoryName(category.name)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Nominees List */}
            <div style={{ marginLeft: '1rem' }}>
              {category.nominees.length === 0 ? (
                <p className="text-muted">No nominees yet</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {category.nominees.map((nominee) => (
                    <li
                      key={nominee.id}
                      className="flex-between"
                      style={{
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #eee',
                        background: nominee.is_winner ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
                      }}
                    >
                      <span>
                        {nominee.name}
                        {nominee.is_winner ? (
                          <span className="badge badge-winner" style={{ marginLeft: '0.5rem' }}>
                            WINNER
                          </span>
                        ) : null}
                      </span>
                      <div className="flex gap-1">
                        {nominee.is_winner ? (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleClearWinner(category.id)}
                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                          >
                            Clear Winner
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSetWinner(category.id, nominee.id)}
                            style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                          >
                            Set Winner
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteNominee(category.id, nominee.id, nominee.name)}
                          style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add Nominee Form */}
              {addingNomineeToCategoryId === category.id ? (
                <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Nominee name"
                    value={newNomineeName}
                    onChange={(e) => setNewNomineeName(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNominee(category.id)
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddNominee(category.id)}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setAddingNomineeToCategoryId(null)
                      setNewNomineeName('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setAddingNomineeToCategoryId(category.id)}
                  style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
                >
                  + Add Nominee
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default CategoryManagement
