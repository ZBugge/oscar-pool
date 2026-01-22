import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div className="container"><h1>Oscar Pool</h1><p>Coming soon...</p></div>} />
      </Routes>
    </Router>
  )
}

export default App
