import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, type SystemStats } from '../api/api'

function StatsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Check auth first
      const admin = await api.auth.me()
      if (admin.username !== 'admin') {
        navigate('/admin')
        return
      }

      const statsData = await api.stats.get()
      setStats(statsData)
    } catch (err: any) {
      if (err.message === 'Not authenticated') {
        navigate('/login')
      } else if (err.message === 'Access denied') {
        navigate('/admin')
      } else {
        setError(err.message || 'Failed to load stats')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasNoData = stats &&
    stats.totals.lobbies === 0 &&
    stats.totals.participants === 0 &&
    stats.topLobbies.length === 0 &&
    stats.topAdmins.length === 0

  if (loading) {
    return <div className="container loading">Loading...</div>
  }

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/admin" style={{ color: '#4299e1', textDecoration: 'none' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>System Stats</h1>

      {error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#e53e3e' }}>
          <p>{error}</p>
        </div>
      ) : hasNoData ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.25rem', color: '#718096' }}>
            No activity yet
          </p>
        </div>
      ) : (
        <>
          {/* Totals Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#4299e1' }}>
                {stats?.totals.admins ?? 0}
              </div>
              <div style={{ fontSize: '1rem', color: '#718096', marginTop: '0.5rem' }}>
                Admin Accounts
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#48bb78' }}>
                {stats?.totals.lobbies ?? 0}
              </div>
              <div style={{ fontSize: '1rem', color: '#718096', marginTop: '0.5rem' }}>
                Lobbies Created
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#805ad5' }}>
                {stats?.totals.participants ?? 0}
              </div>
              <div style={{ fontSize: '1rem', color: '#718096', marginTop: '0.5rem' }}>
                Total Participants
              </div>
            </div>
          </div>

          {/* Leaderboards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Top Lobbies */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2d3748' }}>
                Largest Lobbies
              </h3>
              {stats?.topLobbies && stats.topLobbies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.topLobbies.map((lobby, index) => (
                    <div
                      key={lobby.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        backgroundColor: index === 0 ? '#faf5ff' : '#f7fafc',
                        borderRadius: '0.375rem',
                      }}
                    >
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#805ad5' : index === 1 ? '#a0aec0' : '#cbd5e0',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#2d3748' }}>{lobby.name}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#805ad5' }}>
                        {lobby.participantCount} participants
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center' }}>No lobbies yet</p>
              )}
            </div>

            {/* Top Admins */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#2d3748' }}>
                Most Active Admins
              </h3>
              {stats?.topAdmins && stats.topAdmins.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.topAdmins.map((admin, index) => (
                    <div
                      key={admin.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        backgroundColor: index === 0 ? '#ebf8ff' : '#f7fafc',
                        borderRadius: '0.375rem',
                      }}
                    >
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#4299e1' : index === 1 ? '#a0aec0' : '#cbd5e0',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#2d3748' }}>{admin.username}</div>
                        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                          {admin.lobbyCount} {admin.lobbyCount === 1 ? 'lobby' : 'lobbies'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#4299e1' }}>
                          {admin.totalParticipants}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          participants
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center' }}>No admin activity yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StatsPage
