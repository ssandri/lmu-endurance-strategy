import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { races, stints as stintsApi, drivers as driversApi } from '../api';

const DAMAGE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'bodywork', label: 'Bodywork' },
  { value: 'bodywork_rear_wing', label: 'Bodywork + Rear wing' },
  { value: 'yellow_suspension', label: 'Yellow suspension' },
  { value: 'orange_suspension', label: 'Orange suspension' },
  { value: 'red_suspension', label: 'Red suspension' },
];

export default function RaceExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [stintList, setStintList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingStint, setConfirmingStint] = useState(null);
  const [confirmForm, setConfirmForm] = useState({});
  const [estimatedLaps, setEstimatedLaps] = useState('');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [raceData, stintData, driverData] = await Promise.all([
        races.get(id),
        stintsApi.list(id),
        driversApi.list(id),
      ]);
      setRace(raceData);
      setStintList(stintData);
      setDriverList(driverData);
      setEstimatedLaps(String(raceData.estimated_total_laps));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(stint) {
    try {
      const updated = await stintsApi.confirm(id, stint.id, confirmForm);
      setStintList(updated);
      setConfirmingStint(null);
      setConfirmForm({});
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateLaps() {
    try {
      await races.update(id, { estimatedTotalLaps: parseInt(estimatedLaps) });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReorderDriver(driverId, direction) {
    const idx = driverList.findIndex(d => d.id === driverId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= driverList.length) return;
    const newOrder = [...driverList];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    try {
      const updated = await driversApi.reorder(id, newOrder.map(d => d.id));
      setDriverList(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading">Loading race...</div>;
  if (error && !race) return <div className="error">{error}</div>;
  if (!race) return <div className="error">Race not found</div>;

  const hasStrategy = race.strategies?.some(s => s.is_active);
  const confirmedStints = stintList.filter(s => s.confirmed);
  const futureStints = stintList.filter(s => !s.confirmed);
  const currentStint = futureStints[0];
  const upcomingStints = futureStints.slice(1, 6);

  const driverColors = {};
  const colors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
  driverList.forEach((d, i) => { driverColors[d.id] = colors[i % colors.length]; });

  return (
    <div className="race-execution" data-testid="race-execution-page">
      <div className="exec-header">
        <h2>{race.name}</h2>
        <div className="exec-actions">
          <button className="btn-secondary" onClick={() => navigate(`/races/${id}/strategy/new`)}>New Strategy</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>Dashboard</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="laps-control" data-testid="laps-control">
        <label>Estimated Total Laps:</label>
        <input type="number" value={estimatedLaps} onChange={e => setEstimatedLaps(e.target.value)} min="1" />
        <button className="btn-secondary btn-sm" data-testid="update-laps-btn" onClick={handleUpdateLaps}>Update</button>
      </div>

      <div className="driver-order" data-testid="driver-order">
        <h3>Driver Rotation</h3>
        <div className="driver-list">
          {driverList.map((d, i) => (
            <div key={d.id} className="driver-item" style={{ borderLeft: `4px solid ${driverColors[d.id]}` }}>
              <span>{d.name}</span>
              <div className="order-controls">
                <button onClick={() => handleReorderDriver(d.id, -1)} disabled={i === 0}>↑</button>
                <button onClick={() => handleReorderDriver(d.id, 1)} disabled={i === driverList.length - 1}>↓</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasStrategy ? (
        <div className="empty-state" data-testid="no-strategy">
          <p>No active strategy yet.</p>
          <button className="btn-primary" onClick={() => navigate(`/races/${id}/strategy/new`)}>Create Strategy</button>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="timeline" data-testid="timeline">
            <h3>Race Timeline</h3>
            <div className="timeline-bar">
              {stintList.map(s => {
                const totalLaps = race.estimated_total_laps;
                const width = ((s.planned_end_lap - s.planned_start_lap + 1) / totalLaps) * 100;
                return (
                  <div
                    key={s.id}
                    className={`timeline-block ${s.confirmed ? 'confirmed' : 'planned'}`}
                    style={{ width: `${width}%`, backgroundColor: driverColors[s.driver_id] }}
                    title={`${s.driver_name}: Lap ${s.planned_start_lap}-${s.planned_end_lap}`}
                    data-testid={`timeline-block-${s.stint_number}`}
                  />
                );
              })}
            </div>
            <div className="timeline-legend">
              {driverList.map(d => (
                <span key={d.id} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: driverColors[d.id] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </div>

          {/* Current Stint */}
          {currentStint && (
            <div className="current-stint" data-testid="current-stint">
              <h3>Current Stint</h3>
              <div className="stint-card active">
                <div className="stint-info">
                  <strong>Stint {currentStint.stint_number}</strong> — {currentStint.driver_name}
                  <span className="stint-laps">Laps {currentStint.planned_start_lap}–{currentStint.planned_end_lap}</span>
                  {currentStint.estimated_start_time && <span className="est-time">{new Date(currentStint.estimated_start_time).toLocaleTimeString()}</span>}
                </div>
                {confirmingStint === currentStint.id ? (
                  <div className="confirm-form" data-testid="confirm-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Actual End Lap</label>
                        <input type="number" data-testid="actual-end-lap" value={confirmForm.actualEndLap ?? currentStint.planned_end_lap} onChange={e => setConfirmForm({ ...confirmForm, actualEndLap: parseInt(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label>Fuel Added (%)</label>
                        <input type="number" data-testid="fuel-added" value={confirmForm.fuelAdded ?? 100} onChange={e => setConfirmForm({ ...confirmForm, fuelAdded: parseFloat(e.target.value) })} min="0" max="100" />
                      </div>
                      <div className="form-group">
                        <label>Energy Added (%)</label>
                        <input type="number" data-testid="energy-added" value={confirmForm.energyAdded ?? 99.5} onChange={e => setConfirmForm({ ...confirmForm, energyAdded: parseFloat(e.target.value) })} min="0" max="100" step="0.1" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tyres Changed</label>
                        <select data-testid="tyres-changed" value={confirmForm.tyresChanged ?? 4} onChange={e => setConfirmForm({ ...confirmForm, tyresChanged: parseInt(e.target.value) })}>
                          {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Damage</label>
                        <select data-testid="damage-type" value={confirmForm.damageType ?? 'none'} onChange={e => setConfirmForm({ ...confirmForm, damageType: e.target.value })}>
                          {DAMAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="btn-secondary btn-sm" onClick={() => setConfirmingStint(null)}>Cancel</button>
                      <button className="btn-primary btn-sm" data-testid="confirm-submit" onClick={() => handleConfirm(currentStint)}>Confirm</button>
                    </div>
                  </div>
                ) : (
                  <div className="stint-actions">
                    <button className="btn-primary btn-sm" data-testid="confirm-stint-btn" onClick={() => { setConfirmingStint(currentStint.id); setConfirmForm({}); }}>Confirm Stint</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Stints */}
          {upcomingStints.length > 0 && (
            <div className="upcoming-stints" data-testid="upcoming-stints">
              <h3>Upcoming</h3>
              {upcomingStints.map(s => (
                <div key={s.id} className="stint-card">
                  <div className="stint-info">
                    <strong>Stint {s.stint_number}</strong> — {s.driver_name}
                    <span className="stint-laps">Laps {s.planned_start_lap}–{s.planned_end_lap}</span>
                    {s.estimated_start_time && <span className="est-time">{new Date(s.estimated_start_time).toLocaleTimeString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirmed History */}
          {confirmedStints.length > 0 && (
            <div className="confirmed-stints" data-testid="confirmed-stints">
              <h3>Completed Stints</h3>
              <table className="stint-table">
                <thead><tr><th>#</th><th>Driver</th><th>Laps</th><th>Pit Time</th><th>Damage</th></tr></thead>
                <tbody>
                  {confirmedStints.map(s => (
                    <tr key={s.id}>
                      <td>{s.stint_number}</td>
                      <td>{s.driver_name}</td>
                      <td>{s.planned_start_lap}–{s.actual_end_lap}</td>
                      <td>{s.actual_pit_time_sec ? `${s.actual_pit_time_sec.toFixed(1)}s` : '—'}</td>
                      <td>{s.damage_type === 'none' ? '—' : s.damage_type.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Driver Summary Cards */}
          <div className="driver-summary" data-testid="driver-summary">
            <h3>Driver Summary</h3>
            <div className="summary-cards">
              {driverList.map(d => {
                const driverStints = stintList.filter(s => s.driver_id === d.id);
                const confirmedDriverStints = driverStints.filter(s => s.confirmed);
                const totalLaps = driverStints.reduce((sum, s) => sum + (s.planned_end_lap - s.planned_start_lap + 1), 0);
                const confirmedLaps = confirmedDriverStints.reduce((sum, s) => sum + ((s.actual_end_lap || s.planned_end_lap) - s.planned_start_lap + 1), 0);
                const estDriveTimeMs = totalLaps * (d.avg_lap_time_ms || 0);
                const estDriveMin = Math.round(estDriveTimeMs / 60000);
                return (
                  <div key={d.id} className="summary-card" style={{ borderTop: `3px solid ${driverColors[d.id]}` }}>
                    <h4>{d.name}</h4>
                    <div>Stints: {driverStints.length}</div>
                    <div>Planned laps: {totalLaps}</div>
                    <div>Confirmed laps: {confirmedLaps}</div>
                    {estDriveMin > 0 && <div>Est. drive time: {estDriveMin}m</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
