import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, type Admin, type Lobby } from '../api/api'

function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [lobbies, setLobbies] = useState<(Lobby & { participant_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const data = await api.auth.me()
        setAdmin(data)
        await loadLobbies()
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuthAndLoad()
  }, [navigate])

  const loadLobbies = async () => {
    try {
      const data = await api.lobby.getMyLobbies()
      setLobbies(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await api.auth.logout()
    navigate('/login')
  }

  const handleLock = async (lobbyId: string) => {
    setError('')
    try {
      await api.lobby.lock(lobbyId)
      await loadLobbies()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnlock = async (lobbyId: string) => {
    setError('')
    try {
      await api.lobby.unlock(lobbyId)
      await loadLobbies()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleComplete = async (lobbyId: string) => {
    if (!confirm('Mark this lobby as completed? This is typically done after all winners have been announced.')) return
    setError('')
    try {
      await api.lobby.complete(lobbyId)
      await loadLobbies()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (lobbyId: string, name: string) => {
    if (!confirm(`Delete lobby "${name}" and all its participants?`)) return
    setError('')
    try {
      await api.lobby.delete(lobbyId)
      await loadLobbies()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const copyInviteLink = (lobbyId: string) => {
    const url = `${window.location.origin}/join/${lobbyId}`
    navigator.clipboard.writeText(url)
    alert('Invite link copied to clipboard!')
  }

  if (loading) {
    return <div className="container loading">Loading...</div>
  }

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1>Admin Dashboard</h1>
        <div className="flex gap-2">
          <span style={{ color: 'var(--text-muted)' }}>Welcome, {admin?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Lobbies Section */}
      <div className="card mb-3">
        <div className="flex-between mb-2">
          <h2>Your Lobbies</h2>
          <Link to="/admin/create-lobby" className="btn btn-primary">
            Create Lobby
          </Link>
        </div>

        {lobbies.length === 0 ? (
          <p className="text-muted">No lobbies yet. Create one to get started!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Participants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lobbies.map((lobby) => (
                <tr key={lobby.id}>
                  <td>{lobby.name}</td>
                  <td>
                    <span className={`badge badge-${lobby.status}`}>
                      {lobby.status}
                    </span>
                  </td>
                  <td>{lobby.participant_count ?? 0}</td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => copyInviteLink(lobby.id)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Copy Link
                      </button>
                      <Link
                        to={`/leaderboard/${lobby.id}`}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Leaderboard
                      </Link>
                      {lobby.status === 'open' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleLock(lobby.id)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          Lock
                        </button>
                      )}
                      {lobby.status === 'locked' && (
                        <>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleUnlock(lobby.id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Unlock
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleComplete(lobby.id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Complete
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(lobby.id, lobby.name)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Category Management Section */}
      {admin?.username == 'admin' && (
      <div className="card">
        <h2>Category Management</h2>
        <p className="text-muted mb-2">Set up Oscar categories and nominees for prediction.</p>
        <Link to="/admin/categories" className="btn btn-primary">
          Manage Categories
        </Link>
      </div>
      )}
    </div>
  )
}

export default AdminDashboard
