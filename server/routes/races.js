const { Router } = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const races = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM drivers WHERE race_id = r.id) as driver_count,
      (SELECT COUNT(*) FROM strategies WHERE race_id = r.id AND is_active = 1) as has_active_strategy,
      (SELECT COUNT(*) FROM race_events WHERE race_id = r.id) as event_count
    FROM races r WHERE r.user_id = ? ORDER BY r.created_at DESC
  `).all(req.session.userId);
  res.json(races);
});

router.post('/', (req, res) => {
  const { name, track, durationHours, fuelPerLap, energyPerLap, tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR, availableTyres, estimatedTotalLaps, drivers } = req.body;

  if (!name || !track || !estimatedTotalLaps) {
    return res.status(400).json({ error: 'Name, track, and estimated total laps are required' });
  }

  const result = db.prepare(`
    INSERT INTO races (user_id, name, track, duration_hours, fuel_per_lap, energy_per_lap, tyre_deg_fl, tyre_deg_fr, tyre_deg_rl, tyre_deg_rr, available_tyres, estimated_total_laps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session.userId, name, track,
    durationHours || 12, fuelPerLap || 0, energyPerLap || 0,
    tyreDegFL || 0, tyreDegFR || 0, tyreDegRL || 0, tyreDegRR || 0,
    availableTyres || 32, estimatedTotalLaps
  );

  const raceId = result.lastInsertRowid;

  if (drivers && drivers.length > 0) {
    const insertDriver = db.prepare('INSERT INTO drivers (race_id, name, avg_lap_time_ms, rotation_order) VALUES (?, ?, ?, ?)');
    drivers.forEach((d, i) => {
      if (d.name && d.name.trim()) {
        insertDriver.run(raceId, d.name.trim(), d.avgLapTimeMs || 0, i);
      }
    });
  }

  const race = db.prepare('SELECT * FROM races WHERE id = ?').get(raceId);
  const raceDrivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(raceId);
  res.status(201).json({ ...race, drivers: raceDrivers });
});

router.get('/:id', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });
  const drivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(race.id);
  const strategies = db.prepare('SELECT * FROM strategies WHERE race_id = ?').all(race.id);
  res.json({ ...race, drivers, strategies });
});

router.delete('/:id', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });
  db.prepare('DELETE FROM races WHERE id = ?').run(race.id);
  res.status(204).send();
});

module.exports = router;
