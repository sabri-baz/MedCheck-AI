import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <div className="card">
        <h1>MedCheck AI</h1>
        <h2>Web Dashboard - Version 1.0</h2>
        <p className="status-badge">Vite Ready</p>
        
        <div className="stats-container">
          <button onClick={() => setCount((count) => count + 1)}>
            Health Checks Count: {count}
          </button>
        </div>
        
        <p className="read-the-docs">
          Week 3: Backend-Web-Mobile Integration Full Capacity
        </p>
      </div>
    </div>
  )
}

export default App
