import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [stats, setStats] = useState({ healthChecksCount: 0, usersCount: 0, medicinesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="App">
      <div className="card">
        <h1>MedCheck AI</h1>
        <h2>Web Dashboard - Version 1.0</h2>
        <p className="status-badge">Vite Ready & Connected</p>
        
        <div className="stats-container">
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
            <button>
              Users: {loading ? '...' : stats.usersCount}
            </button>
            <button>
              Medicines: {loading ? '...' : stats.medicinesCount}
            </button>
            <button>
              Health Checks: {loading ? '...' : stats.healthChecksCount}
            </button>
          </div>
        </div>
        
        <p className="read-the-docs">
          Week 4: Backend-Web-Mobile Integration Full Capacity
        </p>
      </div>
    </div>
  )
}

export default App
