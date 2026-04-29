const { Router } = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateVariants } = require('../engine/strategy');

const router = Router();
router.use(requireAuth);

router.post('/:raceId/calculate', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });

  const drivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(race.id);
  if (drivers.length === 0) {
    return res.status(400).json({ error: 'Race must have at least one driver' });
  }

  const { name, startTime, fuelPerLap, energyPerLap, tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR, estimatedTotalLaps } = req.body;

  if (fuelPerLap !== undefined && (fuelPerLap < 0 || fuelPerLap > 200)) {
    return res.status(400).json({ error: 'Fuel per lap must be 0-200' });
  }
  if (energyPerLap !== undefined && (energyPerLap < 0 || energyPerLap > 100)) {
    return res.status(400).json({ error: 'Energy per lap must be 0-100' });
  }
  const tyreDegFields = [tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR];
  for (const val of tyreDegFields) {
    if (val !== undefined && (val < 0 || val > 100)) {
      return res.status(400).json({ error: 'Tyre wear must be 0-100' });
    }
  }
  if (estimatedTotalLaps !== undefined && estimatedTotalLaps <= 0) {
    return res.status(400).json({ error: 'Estimated total laps must be > 0' });
  }

  const overrides = {};
  if (fuelPerLap !== undefined) overrides.fuelPerLap = fuelPerLap;
  if (energyPerLap !== undefined) overrides.energyPerLap = energyPerLap;
  if (tyreDegFL !== undefined) overrides.tyreDegFL = tyreDegFL;
  if (tyreDegFR !== undefined) overrides.tyreDegFR = tyreDegFR;
  if (tyreDegRL !== undefined) overrides.tyreDegRL = tyreDegRL;
  if (tyreDegRR !== undefined) overrides.tyreDegRR = tyreDegRR;
  if (estimatedTotalLaps !== undefined) overrides.estimatedTotalLaps = estimatedTotalLaps;

  const variants = generateVariants({ race, drivers, startTime, overrides });

  const strategyName = name || `Strategy ${new Date().toISOString().slice(0, 16)}`;

  const insertStrategy = db.prepare(`
    INSERT INTO strategies (race_id, name, variant_name, start_time, fuel_per_lap, energy_per_lap, tyre_deg_fl, tyre_deg_fr, tyre_deg_rl, tyre_deg_rr, estimated_total_laps, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const savedVariants = variants.map(v => {
    const result = insertStrategy.run(
      race.id, strategyName, v.name, startTime || null,
      overrides.fuelPerLap ?? race.fuel_per_lap,
      overrides.energyPerLap ?? race.energy_per_lap,
      overrides.tyreDegFL ?? race.tyre_deg_fl,
      overrides.tyreDegFR ?? race.tyre_deg_fr,
      overrides.tyreDegRL ?? race.tyre_deg_rl,
      overrides.tyreDegRR ?? race.tyre_deg_rr,
      overrides.estimatedTotalLaps ?? race.estimated_total_laps,
      JSON.stringify(v)
    );
    return { id: result.lastInsertRowid, ...v };
  });

  res.status(201).json(savedVariants);
});

router.post('/:raceId/activate/:strategyId', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });

  const strategy = db.prepare('SELECT * FROM strategies WHERE id = ? AND race_id = ?').get(req.params.strategyId, race.id);
  if (!strategy) return res.status(404).json({ error: 'Strategy not found' });

  db.prepare('UPDATE strategies SET is_active = 0 WHERE race_id = ?').run(race.id);
  db.prepare('UPDATE strategies SET is_active = 1 WHERE id = ?').run(strategy.id);

  db.prepare('DELETE FROM stints WHERE strategy_id = ?').run(strategy.id);
  const data = JSON.parse(strategy.data);
  const insertStint = db.prepare(`
    INSERT INTO stints (race_id, strategy_id, driver_id, stint_number, planned_start_lap, planned_end_lap, fuel_load, tyres_changed, estimated_start_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (data.stints) {
    data.stints.forEach(s => {
      insertStint.run(race.id, strategy.id, s.driverId, s.stintNumber, s.plannedStartLap, s.plannedEndLap, s.fuelLoad, s.tyresChanged, s.estimatedStartTime);
    });
  }

  res.json({ ...strategy, is_active: 1 });
});

router.get('/:raceId', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });
  const strategies = db.prepare('SELECT * FROM strategies WHERE race_id = ?').all(race.id);
  res.json(strategies.map(s => ({ ...s, data: JSON.parse(s.data) })));
});

module.exports = router;
