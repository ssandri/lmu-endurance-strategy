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
