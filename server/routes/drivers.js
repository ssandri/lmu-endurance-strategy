const { Router } = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/:raceId', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });
  const drivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(race.id);
  res.json(drivers);
});

router.put('/:raceId/order', (req, res) => {
  const race = db.prepare('SELECT * FROM races WHERE id = ? AND user_id = ?').get(req.params.raceId, req.session.userId);
  if (!race) return res.status(404).json({ error: 'Race not found' });

  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'Order must be an array of driver IDs' });
  }

  const update = db.prepare('UPDATE drivers SET rotation_order = ? WHERE id = ? AND race_id = ?');
  order.forEach((driverId, index) => {
    update.run(index, driverId, race.id);
  });

  const drivers = db.prepare('SELECT * FROM drivers WHERE race_id = ? ORDER BY rotation_order').all(race.id);
  res.json(drivers);
});

module.exports = router;
