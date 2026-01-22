import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type Lobby, type CategoryWithNominees } from '../api/api'

function JoinLobby() {
  const { lobbyId } = useParams<{ lobbyId: string }>()
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [categories, setCategories] = useState<CategoryWithNominees[]>([])
  const [name, setName] = useState('')
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const loadLobby = async () => {
      if (!lobbyId) return

      try {
        const [lobbyData, categoriesData] = await Promise.all([
          api.lobby.getById(lobbyId),
          api.lobby.getCategories(lobbyId),
        ])
        setLobby(lobbyData)
        setCategories(categoriesData)
      } catch (err: any) {
        setError(err.message || 'Failed to load lobby')
      } finally {
        setLoading(false)
      }
    }
    loadLobby()
  }, [lobbyId])

  const handlePredictionChange = (categoryId: number, nomineeId: number) => {
    setPredictions(prev => ({ ...prev, [categoryId]: nomineeId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    // Check all categories have predictions
    const missingCategories = categories.filter(cat => !predictions[cat.id])
    if (missingCategories.length > 0) {
      setError(`Please make a prediction for: ${missingCategories.map(c => c.name).join(', ')}`)
      return
    }

    setSubmitting(true)

    try {
      const predictionsArray = Object.entries(predictions).map(([categoryId, nomineeId]) => ({
        categoryId: parseInt(categoryId),
        nomineeId,
      }))

      await api.participant.submit(lobbyId!, name.trim(), predictionsArray)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit predictions')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="container loading">Loading...</div>
  }

  if (!lobby) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Lobby Not Found</h2>
          <p className="text-muted">This lobby doesn't exist or has been deleted.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  if (lobby.status !== 'open') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Predictions Closed</h2>
          <p className="text-muted">
            This lobby is no longer accepting predictions.
            {lobby.status === 'locked' && ' The ceremony may be starting soon!'}
            {lobby.status === 'completed' && ' The ceremony has ended.'}
          </p>
          <Link to={`/leaderboard/${lobbyId}`} className="btn btn-primary">
            View Leaderboard
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2 style={{ color: 'var(--gold)' }}>Predictions Submitted!</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Good luck, {name}! Your predictions have been recorded.
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            Check back during the ceremony to see the live leaderboard.
          </p>
          <Link to={`/leaderboard/${lobbyId}`} className="btn btn-primary">
            View Leaderboard
          </Link>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>No Categories Yet</h2>
          <p className="text-muted">
            The admin hasn't set up the Oscar categories yet. Check back later!
          </p>
        </div>
      </div>
    )
  }

  const completedCount = Object.keys(predictions).length
  const totalCategories = categories.length

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1 style={{ textAlign: 'center' }}>{lobby.name}</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Make your Oscar predictions below
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="card mb-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
              <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                This is how you'll appear on the leaderboard
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="card mb-3" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: completedCount === totalCategories ? 'var(--gold)' : 'inherit'
            }}>
              {completedCount} of {totalCategories} categories selected
            </div>
            <div style={{
              marginTop: '0.5rem',
              height: '8px',
              background: 'var(--border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${(completedCount / totalCategories) * 100}%`,
                background: 'var(--gold)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Categories */}
          {categories.map((category) => (
            <div key={category.id} className="card mb-2">
              <h3 style={{ marginBottom: '1rem', color: predictions[category.id] ? 'var(--gold)' : 'inherit' }}>
                {category.name}
                {predictions[category.id] && ' ✓'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {category.nominees.map((nominee) => (
                  <label
                    key={nominee.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: predictions[category.id] === nominee.id ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-light)',
                      border: predictions[category.id] === nominee.id ? '2px solid var(--gold)' : '2px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name={`category-${category.id}`}
                      value={nominee.id}
                      checked={predictions[category.id] === nominee.id}
                      onChange={() => handlePredictionChange(category.id, nominee.id)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span style={{ fontWeight: predictions[category.id] === nominee.id ? 600 : 400 }}>
                      {nominee.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="card" style={{ position: 'sticky', bottom: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || completedCount !== totalCategories || !name.trim()}
              style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
            >
              {submitting ? 'Submitting...' : `Submit ${totalCategories} Predictions`}
            </button>
            {completedCount !== totalCategories && (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '0.5rem', marginBottom: 0 }}>
                Select a nominee for each category to submit
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinLobby
