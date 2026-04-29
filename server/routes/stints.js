const { Router } = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { calculatePitTime } = require('../engine/pitTime');
const { recalculateFromLap } = require('../engine/strategy');

const router = Router();
router.use(requireAuth);

router.get('/:raceId', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });

  const activeStrategy = db.prepare('SELECT * FROM strategies WHERE race_id = ? AND is_active = 1').get(race.id);
  if (!activeStrategy) return res.json([]);

  const stints = db.prepare(`
    SELECT s.*, d.name as driver_name
    FROM stints s JOIN drivers d ON s.driver_id = d.id
    WHERE s.race_id = ? AND s.strategy_id = ?
    ORDER BY s.stint_number
  `).all(race.id, activeStrategy.id);

  res.json(stints);
});

router.post('/:raceId/confirm/:stintId', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });

  const stint = db.prepare('SELECT * FROM stints WHERE id = ? AND race_id = ?').get(req.params.stintId, race.id);
  if (!stint) return res.status(404).json({ error: 'Stint not found' });

  const { actualEndLap, fuelAdded, energyAdded, tyresChanged, damageType } = req.body;
  const endLap = actualEndLap ?? stint.planned_end_lap;
  const fuel = fuelAdded ?? 100;
  const energy = energyAdded ?? 99.5;
  const tyres = tyresChanged ?? 4;
  const damage = damageType || 'none';

  const pitTime = calculatePitTime({ fuelAdded: fuel, tyresChanged: tyres, damageType: damage });

  db.prepare(`
    UPDATE stints SET confirmed = 1, actual_end_lap = ?, fuel_added = ?, energy_added = ?, tyres_changed = ?, damage_type = ?, actual_pit_time_sec = ?
    WHERE id = ?
  `).run(endLap, fuel, energy, tyres, damage, pitTime, stint.id);

  const activeStrategy = db.prepare('SELECT * FROM strategies WHERE race_id = ? AND is_active = 1').get(race.id);
  const confirmedStints = db.prepare('SELECT * FROM stints WHERE strategy_id = ? AND confirmed = 1 ORDER BY stint_number').all(activeStrategy.id);
  const drivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(race.id);

  const nextLap = endLap + 1;
  const plan = recalculateFromLap({
    race,
    drivers,
    strategy: activeStrategy,
    confirmedStints,
    currentLap: nextLap,
    startTime: activeStrategy.start_time,
  });

  db.prepare('DELETE FROM stints WHERE strategy_id = ? AND confirmed = 0').run(activeStrategy.id);

  const insertStint = db.prepare(`
    INSERT INTO stints (race_id, strategy_id, driver_id, stint_number, planned_start_lap, planned_end_lap, fuel_load, tyres_changed, estimated_start_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  plan.stints.forEach(s => {
    insertStint.run(race.id, activeStrategy.id, s.driverId, s.stintNumber, s.plannedStartLap, s.plannedEndLap, s.fuelLoad, s.tyresChanged, s.estimatedStartTime);
  });

  db.prepare('INSERT INTO race_events (race_id, lap, type, details) VALUES (?, ?, ?, ?)').run(
    race.id, endLap, 'stint_confirmed', JSON.stringify({ stintId: stint.id, pitTime, damageType: damage })
  );

  const allStints = db.prepare(`
    SELECT s.*, d.name as driver_name
    FROM stints s JOIN drivers d ON s.driver_id = d.id
    WHERE s.race_id = ? AND s.strategy_id = ?
    ORDER BY s.stint_number
  `).all(race.id, activeStrategy.id);

  res.json(allStints);
});

module.exports = router;
