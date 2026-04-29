import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RaceCreate from './pages/RaceCreate';
import StrategyCreate from './pages/StrategyCreate';
import StrategyCompare from './pages/StrategyCompare';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>LMU Endurance Strategy</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={() => { auth.logout(); setUser(null); }}>Logout</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/races/new" element={<RaceCreate />} />
          <Route path="/races/:id/strategy/new" element={<StrategyCreate />} />
          <Route path="/races/:id/strategy/compare" element={<StrategyCompare />} />
          <Route path="/races/:id" element={<div className="placeholder">Race Execution (EPIC 4)</div>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
