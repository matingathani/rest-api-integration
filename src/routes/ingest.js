const express = require('express');
const store = require('../store');
const { validateSingleRecord, validateBatchRecords } = require('../middleware/validate');

const router = express.Router();

// POST /api/data — ingest a single record
router.post('/data', validateSingleRecord, (req, res) => {
  const record = req.body;

  if (store.has(record.id)) {
    return res.status(409).json({
      error: 'Conflict',
      message: `Record with id '${record.id}' already exists`,
    });
  }

  const saved = store.save({
    ...record,
    timestamp: record.timestamp || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  });

  res.status(201).json({
    message: 'Record ingested successfully',
    record: saved,
  });
});

// POST /api/batch — ingest multiple records
router.post('/batch', validateBatchRecords, (req, res) => {
  const { records } = req.body;

  if (records.length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['records array cannot be empty'],
    });
  }

  const duplicates = records.filter((r) => store.has(r.id)).map((r) => r.id);

  if (duplicates.length > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Some records already exist',
      duplicateIds: duplicates,
    });
  }

  const timestampedRecords = records.map((r) => ({
    ...r,
    timestamp: r.timestamp || new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
  }));

  const saved = store.saveMany(timestampedRecords);

  res.status(201).json({
    message: `${saved.length} records ingested successfully`,
    count: saved.length,
    records: saved,
  });
});

module.exports = router;
