import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { races, strategies } from '../api';

export default function StrategyCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [race, setRace] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [fuelPerLap, setFuelPerLap] = useState('');
  const [energyPerLap, setEnergyPerLap] = useState('');
  const [tyreDegFL, setTyreDegFL] = useState('');
  const [tyreDegFR, setTyreDegFR] = useState('');
  const [tyreDegRL, setTyreDegRL] = useState('');
  const [tyreDegRR, setTyreDegRR] = useState('');
  const [estimatedTotalLaps, setEstimatedTotalLaps] = useState('');
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    races.get(id).then(r => {
      setRace(r);
      setName(`${r.name} Strategy`);
      setFuelPerLap(String(r.fuel_per_lap));
      setEnergyPerLap(String(r.energy_per_lap));
      setTyreDegFL(String(r.tyre_deg_fl));
      setTyreDegFR(String(r.tyre_deg_fr));
      setTyreDegRL(String(r.tyre_deg_rl));
      setTyreDegRR(String(r.tyre_deg_rr));
      setEstimatedTotalLaps(r.estimated_total_laps ? String(r.estimated_total_laps) : '');
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  async function handleCalculate(e) {
    e.preventDefault();
    setError('');

    const fuel = parseFloat(fuelPerLap);
    const energy = parseFloat(energyPerLap);
    const laps = parseInt(estimatedTotalLaps);

    if (fuel < 0 || fuel > 200) { setError('Fuel per lap must be 0-200 L'); return; }
    if (energy < 0 || energy > 100) { setError('Energy per lap must be 0-100'); return; }
    if (!laps || laps <= 0) { setError('Estimated total laps must be > 0'); return; }

    setCalculating(true);
    try {
      const variants = await strategies.calculate(id, {
        name,
        startTime: startTime || undefined,
        fuelPerLap: fuel,
        energyPerLap: energy,
        tyreDegFL: parseFloat(tyreDegFL),
        tyreDegFR: parseFloat(tyreDegFR),
        tyreDegRL: parseFloat(tyreDegRL),
        tyreDegRR: parseFloat(tyreDegRR),
        estimatedTotalLaps: laps,
      });
      navigate(`/races/${id}/strategy/compare`, { state: { variants, formValues: { name, startTime, fuelPerLap, energyPerLap, tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR, estimatedTotalLaps } } });
    } catch (err) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  }

  if (loading) return <div className="loading">Loading race data...</div>;
  if (!race) return <div className="error">Race not found</div>;

  return (
    <div className="strategy-create" data-testid="strategy-create-page">
      <h2>Strategy — Step 1: Configure</h2>
      <p className="subtitle">Race: {race.name}</p>
      {error && <div className="error" data-testid="strategy-error">{error}</div>}
      <form onSubmit={handleCalculate}>
        <div className="form-row">
          <div className="form-group">
            <label>Strategy Name</label>
            <input type="text" data-testid="strategy-name-input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Race Start Time</label>
            <input type="datetime-local" data-testid="start-time-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fuel/Lap (L)</label>
            <input type="number" data-testid="strategy-fuel-input" value={fuelPerLap} onChange={e => setFuelPerLap(e.target.value)} min="0" max="200" step="0.01" />
          </div>
          <div className="form-group">
            <label>Energy/Lap (%)</label>
            <input type="number" data-testid="strategy-energy-input" value={energyPerLap} onChange={e => setEnergyPerLap(e.target.value)} min="0" max="100" step="0.01" />
          </div>
          <div className="form-group">
            <label>Est. Total Laps</label>
            <input type="number" data-testid="strategy-laps-input" value={estimatedTotalLaps} onChange={e => setEstimatedTotalLaps(e.target.value)} min="1" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group"><label>Tyre Deg FL (%/lap)</label><input type="number" data-testid="strategy-tyre-fl-input" value={tyreDegFL} onChange={e => setTyreDegFL(e.target.value)} min="0" max="100" step="0.01" /></div>
          <div className="form-group"><label>Tyre Deg FR (%/lap)</label><input type="number" data-testid="strategy-tyre-fr-input" value={tyreDegFR} onChange={e => setTyreDegFR(e.target.value)} min="0" max="100" step="0.01" /></div>
          <div className="form-group"><label>Tyre Deg RL (%/lap)</label><input type="number" data-testid="strategy-tyre-rl-input" value={tyreDegRL} onChange={e => setTyreDegRL(e.target.value)} min="0" max="100" step="0.01" /></div>
          <div className="form-group"><label>Tyre Deg RR (%/lap)</label><input type="number" data-testid="strategy-tyre-rr-input" value={tyreDegRR} onChange={e => setTyreDegRR(e.target.value)} min="0" max="100" step="0.01" /></div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(`/races/${id}`)}>Cancel</button>
          <button type="submit" className="btn-primary" data-testid="calculate-btn" disabled={calculating}>
            {calculating ? 'Calculating...' : 'Calculate Strategy'}
          </button>
        </div>
      </form>
    </div>
  );
}
