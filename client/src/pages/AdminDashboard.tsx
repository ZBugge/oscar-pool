import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, type Admin } from '../api/api'

function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.auth.me()
        setAdmin(data)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [navigate])

  const handleLogout = async () => {
    await api.auth.logout()
    navigate('/login')
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

      <div className="card">
        <h2>Your Lobbies</h2>
        <p className="text-muted mb-2">No lobbies yet. Create one to get started!</p>
        <Link to="/admin/create-lobby" className="btn btn-primary">
          Create Lobby
        </Link>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>Category Management</h2>
        <p className="text-muted mb-2">Set up Oscar categories and nominees for prediction.</p>
        <Link to="/admin/categories" className="btn btn-primary">
          Manage Categories
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
