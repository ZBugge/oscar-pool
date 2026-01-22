import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Oscar Pool</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Predict the winners. Compete with friends. Celebrate cinema.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary">
            Admin Login
          </Link>
          <Link to="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '1rem' }}>How It Works</h2>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '2' }}>
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
