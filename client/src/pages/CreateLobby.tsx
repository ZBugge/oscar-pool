import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/api'

function CreateLobby() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.auth.me()
      } catch {
        navigate('/login')
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Lobby name is required')
      return
    }

    setLoading(true)

    try {
      const lobby = await api.lobby.create(name.trim())
      // Copy invite link to clipboard
      const url = `${window.location.origin}/join/${lobby.id}`
      await navigator.clipboard.writeText(url)
      alert(`Lobby created! Invite link copied to clipboard:\n${url}`)
      navigate('/admin')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return <div className="container loading">Loading...</div>
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <h1>Create New Lobby</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Lobby Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Family Oscar Night 2025"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating...' : 'Create Lobby'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/admin">Back to Dashboard</Link>
          </div>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>How It Works</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Create a lobby with a memorable name</li>
            <li>Share the invite link with your friends</li>
            <li>They submit their Oscar predictions</li>
            <li>Lock the lobby before the ceremony starts</li>
            <li>Track scores on the live leaderboard!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default CreateLobby
