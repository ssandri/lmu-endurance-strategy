import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { strategies } from '../api';

function formatTime(ms) {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(mil).padStart(3, '0')}`;
}

export default function StrategyCompare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const variants = location.state?.variants || [];
  const formValues = location.state?.formValues || {};
  const [expanded, setExpanded] = useState(null);
  const [activating, setActivating] = useState(false);

  async function handleActivate(strategyId) {
    setActivating(true);
    try {
      await strategies.activate(id, strategyId);
      navigate(`/races/${id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setActivating(false);
    }
  }

  if (variants.length === 0) {
    return (
      <div className="strategy-compare" data-testid="strategy-compare-page">
        <h2>Strategy — Step 2: Compare</h2>
        <p>No variants available. <button className="btn-secondary" onClick={() => navigate(`/races/${id}/strategy/new`)}>Go back</button></p>
      </div>
    );
  }

  return (
    <div className="strategy-compare" data-testid="strategy-compare-page">
      <h2>Strategy — Step 2: Compare & Choose</h2>

      <table className="compare-table" data-testid="compare-table">
        <thead>
          <tr>
            <th>Variant</th>
            <th>Total Laps</th>
            <th>Pit Stops</th>
            <th>Avg Pace</th>
            <th>Feasibility</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => (
            <React.Fragment key={v.id || i}>
              <tr data-testid={`variant-row-${i}`}>
                <td><button className="link-btn" data-testid={`expand-variant-${i}`} onClick={() => setExpanded(expanded === i ? null : i)}>{v.name}</button></td>
                <td>{v.estimatedTotalLaps}</td>
                <td>{v.pitStops}</td>
                <td>{formatTime(v.avgPace)}</td>
                <td>{v.feasible ? <span className="badge active">Feasible</span> : <span className="badge warning" data-testid="feasibility-warning">Tyre shortage</span>}</td>
                <td><button className="btn-primary btn-sm" data-testid={`activate-variant-${i}`} onClick={() => handleActivate(v.id)} disabled={activating}>Use this</button></td>
              </tr>
              {expanded === i && (
                <tr className="detail-row" data-testid={`variant-detail-${i}`}>
                  <td colSpan="6">
                    <div className="stint-detail">
                      {v.fuelSaveTargets && (
                        <div className="fuel-save-targets" data-testid="fuel-save-targets">
                          <h4>Fuel Save Targets</h4>
                          {v.fuelSaveTargets.map(t => (
                            <div key={t.driverId}>{t.driverName}: {t.targetFuelPerLap.toFixed(2)}%/lap fuel, max pace loss {t.maxPaceLoss}</div>
                          ))}
                        </div>
                      )}
                      {!v.feasible && <div className="warning-box" data-testid="tyre-warning">Warning: Tyre supply insufficient. {v.tyresUsed} tyres needed vs available.</div>}
                      <table className="stint-table" data-testid="stint-table">
                        <thead>
                          <tr><th>#</th><th>Driver</th><th>Start Lap</th><th>End Lap</th><th>Fuel Load</th><th>Tyre Change</th><th>Est. Start</th><th>Pit Time</th></tr>
                        </thead>
                        <tbody>
                          {v.stints.map(s => (
                            <tr key={s.stintNumber}>
                              <td>{s.stintNumber}</td>
                              <td>{s.driverName}</td>
                              <td>{s.plannedStartLap}</td>
                              <td>{s.plannedEndLap}</td>
                              <td>{s.fuelLoad}%</td>
                              <td>{s.tyresChanged > 0 ? `Yes (${s.tyresChanged})` : 'No'}</td>
                              <td>{s.estimatedStartTime ? new Date(s.estimatedStartTime).toLocaleTimeString() : '—'}</td>
                              <td>{s.estimatedPitTime ? `${s.estimatedPitTime.toFixed(1)}s` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="form-actions">
        <button className="btn-secondary" data-testid="back-to-step1" onClick={() => navigate(`/races/${id}/strategy/new`, { state: { formValues } })}>Back to Step 1</button>
      </div>
    </div>
  );
}
