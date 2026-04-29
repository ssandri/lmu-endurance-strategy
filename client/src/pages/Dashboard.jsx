import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { races } from '../api';

export default function Dashboard() {
  const [raceList, setRaceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    races.list()
      .then(setRaceList)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}" and all associated data?`)) return;
    try {
      await races.delete(id);
      setRaceList(raceList.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading" data-testid="loading">Loading races...</div>;
  if (error) return <div className="error" data-testid="error">Failed to load races: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>My Races</h2>
        <button className="btn-primary" data-testid="new-race-btn" onClick={() => navigate('/races/new')}>New Race</button>
      </div>
      {raceList.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <p>No races yet. Create your first race to get started with strategy planning.</p>
          <button className="btn-primary" onClick={() => navigate('/races/new')}>New Race</button>
        </div>
      ) : (
        <div className="race-grid" data-testid="race-grid">
          {raceList.map(race => (
            <div key={race.id} className="race-card" data-testid={`race-card-${race.id}`} onClick={() => navigate(`/races/${race.id}`)}>
              <h3 data-testid="race-name">{race.name}</h3>
              <div className="race-meta">
                <span data-testid="race-track">{race.track}</span>
                <span data-testid="race-duration">{race.duration_hours}h</span>
                <span data-testid="race-drivers">{race.driver_count} driver{race.driver_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="race-status">
                <span className={race.has_active_strategy ? 'badge active' : 'badge'} data-testid="race-strategy-badge">
                  {race.has_active_strategy ? 'Strategy Active' : 'No Strategy'}
                </span>
                <span className="event-count" data-testid="race-events">{race.event_count} event{race.event_count !== 1 ? 's' : ''}</span>
              </div>
              <button
                className="btn-danger btn-sm"
                data-testid={`delete-race-${race.id}`}
                onClick={e => { e.stopPropagation(); handleDelete(race.id, race.name); }}
              >Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
