const express = require('express');
const store = require('../store');

const router = express.Router();

// GET /api/data — retrieve all records, optional ?type= filter
router.get('/data', (req, res) => {
  let records = store.getAll();
  const { type } = req.query;

  if (type) {
    records = records.filter((r) => r.type === type);
  }

  res.json({
    count: records.length,
    records,
  });
});

// GET /api/data/:id — retrieve by ID
router.get('/data/:id', (req, res) => {
  const { id } = req.params;
  const record = store.getById(id);

  if (!record) {
    return res.status(404).json({
      error: 'Not found',
      message: `Record with id '${id}' not found`,
    });
  }

  res.json(record);
});

// GET /api/stats — aggregated stats
router.get('/stats', (req, res) => {
  const stats = store.getStats();
  res.json(stats);
});

module.exports = router;
