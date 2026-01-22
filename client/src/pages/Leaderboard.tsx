import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, type LeaderboardEntry, type LeaderboardStats } from '../api/api'
import PicksModal from '../components/PicksModal'

const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds

function Leaderboard() {
  const { lobbyId } = useParams<{ lobbyId: string }>()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [lobbyName, setLobbyName] = useState('')
  const [lobbyStatus, setLobbyStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: number
    name: string
  } | null>(null)

  const loadLeaderboard = useCallback(async () => {
    if (!lobbyId) return

    try {
      const data = await api.leaderboard.get(lobbyId)
      setEntries(data.entries)
      setStats(data.stats)
      setLobbyName(data.lobbyName)
      setLobbyStatus(data.lobbyStatus)
      setLastUpdated(new Date())
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [lobbyId])

  // Initial load
  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadLeaderboard, AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadLeaderboard])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (loading) {
    return <div className="container loading">Loading leaderboard...</div>
  }

  if (error && entries.length === 0) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Leaderboard Not Found</h2>
          <p className="text-muted">{error}</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>{lobbyName}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className={`badge badge-${lobbyStatus}`}>
              {lobbyStatus === 'open' ? 'Accepting Predictions' : lobbyStatus === 'locked' ? 'Locked' : 'Completed'}
            </span>
            {lastUpdated && (
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                Last updated: {formatTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* Stats Card */}
        {stats && (
          <div className="card mb-3" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {stats.totalParticipants}
                </div>
                <div className="text-muted">Participants</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {stats.categoriesAnnounced}/{stats.totalCategories}
                </div>
                <div className="text-muted">Winners Announced</div>
              </div>
            </div>
            {lobbyStatus === 'open' && (
              <p className="text-muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
                Picks are hidden until the lobby is locked
              </p>
            )}
          </div>
        )}

        {/* Leaderboard Table */}
        {entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="text-muted">No participants yet.</p>
            {lobbyStatus === 'open' && (
              <Link to={`/join/${lobbyId}`} className="btn btn-primary">
                Be the first to submit predictions!
              </Link>
            )}
          </div>
        ) : (
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Name</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Score</th>
                  {lobbyStatus !== 'open' && (
                    <th style={{ width: '100px', textAlign: 'center' }}>Picks</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.participantId}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: entry.rank === 1 ? 'var(--gold)' :
                                   entry.rank === 2 ? '#c0c0c0' :
                                   entry.rank === 3 ? '#cd7f32' : 'var(--bg-light)',
                        color: entry.rank <= 3 ? '#1a1a1a' : 'inherit',
                        fontWeight: entry.rank <= 3 ? 700 : 400,
                      }}>
                        {entry.rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: index === 0 ? 600 : 400 }}>
                      {entry.name}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: entry.score > 0 ? 'var(--gold)' : 'inherit',
                      }}>
                        {entry.score}
                      </span>
                      {stats && stats.categoriesAnnounced > 0 && (
                        <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                          /{stats.categoriesAnnounced}
                        </span>
                      )}
                    </td>
                    {lobbyStatus !== 'open' && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedParticipant({ id: entry.participantId, name: entry.name })}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>
            Auto-refreshes every 30 seconds
          </span>
          <button
            onClick={loadLeaderboard}
            className="btn btn-secondary"
            style={{ marginLeft: '1rem', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
          >
            Refresh Now
          </button>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" className="text-muted">← Back to Home</Link>
        </div>
      </div>

      {/* Picks Modal */}
      {selectedParticipant && lobbyId && (
        <PicksModal
          participantId={selectedParticipant.id}
          participantName={selectedParticipant.name}
          lobbyId={lobbyId}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  )
}

export default Leaderboard
