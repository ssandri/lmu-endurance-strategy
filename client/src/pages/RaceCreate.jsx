import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { races } from '../api';
import { TRACKS } from '../constants';

export default function RaceCreate() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [track, setTrack] = useState(TRACKS[0]);
  const [customTrack, setCustomTrack] = useState('');
  const [name, setName] = useState(`${TRACKS[0]} – ${today} – 1`);
  const [durationHours, setDurationHours] = useState('12');
  const [fuelPerLap, setFuelPerLap] = useState('0');
  const [energyPerLap, setEnergyPerLap] = useState('0');
  const [tyreDegFL, setTyreDegFL] = useState('0');
  const [tyreDegFR, setTyreDegFR] = useState('0');
  const [tyreDegRL, setTyreDegRL] = useState('0');
  const [tyreDegRR, setTyreDegRR] = useState('0');
  const [availableTyres, setAvailableTyres] = useState('32');
  const [drivers, setDrivers] = useState([{ name: '', avgLapTime: '' }]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function handleTrackChange(value) {
    setTrack(value);
    const trackName = value === 'Other' ? customTrack : value;
    setName(`${trackName} – ${today} – 1`);
  }

  function parseLapTime(str) {
    if (!str) return 0;
    const match = str.match(/^(\d+):(\d{2})\.(\d{3})$/);
    if (!match) return null;
    return parseInt(match[1]) * 60000 + parseInt(match[2]) * 1000 + parseInt(match[3]);
  }

  function addDriver() {
    setDrivers([...drivers, { name: '', avgLapTime: '' }]);
  }

  function updateDriver(index, field, value) {
    const updated = [...drivers];
    updated[index] = { ...updated[index], [field]: value };
    setDrivers(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};

    const validDrivers = [];
    for (let i = 0; i < drivers.length; i++) {
      const d = drivers[i];
      if (!d.name.trim()) continue;
      if (d.avgLapTime) {
        const ms = parseLapTime(d.avgLapTime);
        if (ms === null) {
          errors[`driver_${i}_pace`] = `Invalid format for ${d.name}. Use M:SS.mmm`;
        } else {
          validDrivers.push({ name: d.name, avgLapTimeMs: ms });
        }
      } else {
        validDrivers.push({ name: d.name, avgLapTimeMs: 0 });
      }
    }

    if (validDrivers.length === 0 && !errors.driver_pace) {
      errors.drivers = 'At least one driver is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const trackName = track === 'Other' ? customTrack : track;

    try {
      const race = await races.create({
        name,
        track: trackName,
        durationHours: parseFloat(durationHours),
        fuelPerLap: parseFloat(fuelPerLap),
        energyPerLap: parseFloat(energyPerLap),
        tyreDegFL: parseFloat(tyreDegFL),
        tyreDegFR: parseFloat(tyreDegFR),
        tyreDegRL: parseFloat(tyreDegRL),
        tyreDegRR: parseFloat(tyreDegRR),
        availableTyres: parseInt(availableTyres),
        drivers: validDrivers,
      });
      navigate(`/races/${race.id}/strategy/new`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="race-create" data-testid="race-create-page">
      <h2>Create New Race</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Track</label>
          <select data-testid="track-select" value={track} onChange={e => handleTrackChange(e.target.value)}>
            {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
            <option value="Other">Other</option>
          </select>
          {track === 'Other' && (
            <input
              type="text"
              data-testid="custom-track-input"
              placeholder="Enter track name"
              value={customTrack}
              onChange={e => { setCustomTrack(e.target.value); setName(`${e.target.value} – ${today} – 1`); }}
            />
          )}
        </div>

        <div className="form-group">
          <label>Race Name</label>
          <input type="text" data-testid="race-name-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duration (hours)</label>
            <input type="number" data-testid="duration-input" value={durationHours} onChange={e => setDurationHours(e.target.value)} min="0" step="0.5" required />
          </div>
          <div className="form-group">
            <label>Available Tyres</label>
            <input type="number" data-testid="available-tyres-input" value={availableTyres} onChange={e => setAvailableTyres(e.target.value)} min="0" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fuel/Lap (%)</label>
            <input type="number" data-testid="fuel-per-lap-input" value={fuelPerLap} onChange={e => setFuelPerLap(e.target.value)} min="0" max="200" step="0.01" />
          </div>
          <div className="form-group">
            <label>Energy/Lap (%)</label>
            <input type="number" data-testid="energy-per-lap-input" value={energyPerLap} onChange={e => setEnergyPerLap(e.target.value)} min="0" max="100" step="0.01" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tyre Deg FL (%/lap)</label>
            <input type="number" data-testid="tyre-deg-fl-input" value={tyreDegFL} onChange={e => setTyreDegFL(e.target.value)} min="0" max="100" step="0.01" />
          </div>
          <div className="form-group">
            <label>Tyre Deg FR (%/lap)</label>
            <input type="number" data-testid="tyre-deg-fr-input" value={tyreDegFR} onChange={e => setTyreDegFR(e.target.value)} min="0" max="100" step="0.01" />
          </div>
          <div className="form-group">
            <label>Tyre Deg RL (%/lap)</label>
            <input type="number" data-testid="tyre-deg-rl-input" value={tyreDegRL} onChange={e => setTyreDegRL(e.target.value)} min="0" max="100" step="0.01" />
          </div>
          <div className="form-group">
            <label>Tyre Deg RR (%/lap)</label>
            <input type="number" data-testid="tyre-deg-rr-input" value={tyreDegRR} onChange={e => setTyreDegRR(e.target.value)} min="0" max="100" step="0.01" />
          </div>
        </div>

        <div className="form-section">
          <h3>Drivers</h3>
          {fieldErrors.drivers && <div className="field-error">{fieldErrors.drivers}</div>}
          {drivers.map((d, i) => (
            <div key={i} className="form-row driver-row">
              <div className="form-group">
                <input type="text" data-testid={`driver-name-${i}`} placeholder="Driver name" value={d.name} onChange={e => updateDriver(i, 'name', e.target.value)} />
              </div>
              <div className="form-group">
                <input type="text" data-testid={`driver-pace-${i}`} placeholder="Avg pace (M:SS.mmm)" value={d.avgLapTime} onChange={e => updateDriver(i, 'avgLapTime', e.target.value)} />
                {fieldErrors[`driver_${i}_pace`] && <span className="field-error">{fieldErrors[`driver_${i}_pace`]}</span>}
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" data-testid="add-driver-btn" onClick={addDriver}>+ Add Driver</button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn-primary" data-testid="submit-race-btn">Create Race</button>
        </div>
      </form>
    </div>
  );
}
