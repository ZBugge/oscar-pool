import { useState, useEffect } from 'react'
import { api, type ParticipantPick } from '../api/api'

interface PicksModalProps {
  participantId: number
  participantName: string
  lobbyId: string
  onClose: () => void
}

function PicksModal({ participantId, participantName, lobbyId, onClose }: PicksModalProps) {
  const [picks, setPicks] = useState<ParticipantPick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPicks = async () => {
      try {
        const data = await api.participant.getPicks(participantId, lobbyId)
        setPicks(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load picks')
      } finally {
        setLoading(false)
      }
    }
    loadPicks()
  }, [participantId, lobbyId])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const correctCount = picks.filter(p => p.isCorrect === true).length
  const incorrectCount = picks.filter(p => p.isCorrect === false).length
  const pendingCount = picks.filter(p => p.isCorrect === null).length

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="modal-content card"
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'var(--bg-light)',
            border: '1px solid var(--card-border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: 'var(--bg-dark)',
          }}
          aria-label="Close"
        >
          ×
        </button>

        <h2 style={{ marginBottom: '0.5rem', paddingRight: '2rem' }}>{participantName}'s Picks</h2>

        {!loading && !error && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--success)' }}>✓ {correctCount} correct</span>
            <span style={{ color: 'var(--danger)' }}>✗ {incorrectCount} incorrect</span>
            {pendingCount > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>? {pendingCount} pending</span>
            )}
          </div>
        )}

        {loading && <p className="text-muted">Loading picks...</p>}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {picks.map((pick) => (
              <div
                key={pick.categoryId}
                style={{
                  padding: '0.75rem 1rem',
                  background: pick.isCorrect === true
                    ? 'rgba(40, 167, 69, 0.1)'
                    : pick.isCorrect === false
                      ? 'rgba(220, 53, 69, 0.1)'
                      : 'var(--bg-light)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${
                    pick.isCorrect === true
                      ? 'var(--success)'
                      : pick.isCorrect === false
                        ? 'var(--danger)'
                        : 'var(--border)'
                  }`,
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem'
                }}>
                  {pick.categoryName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 500 }}>{pick.nomineeName}</span>
                  {pick.isCorrect === true && (
                    <span style={{ color: 'var(--success)' }}>✓</span>
                  )}
                  {pick.isCorrect === false && (
                    <>
                      <span style={{ color: 'var(--danger)' }}>✗</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        (Winner: {pick.winnerName})
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PicksModal
