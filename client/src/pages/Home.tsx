import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: 'clamp(2rem, 8vw, 4rem)' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '1rem' }}>Oscar Pool</h1>
        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: 'var(--text-muted)', marginBottom: '2rem', padding: '0 1rem' }}>
          Predict the winners. Compete with friends. Celebrate cinema.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 1rem' }}>
          <Link to="/login" className="btn btn-primary" style={{ minWidth: '140px' }}>
            Admin Login
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ minWidth: '140px' }}>
            Create Account
          </Link>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '1rem' }}>How It Works</h2>
          <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
            <li>Admin creates a lobby and shares the invite link</li>
            <li>Participants submit predictions for all Oscar categories</li>
            <li>Admin locks predictions before the ceremony</li>
            <li>Watch the Oscars and track scores live on the leaderboard</li>
            <li>Winner gets bragging rights!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Home
