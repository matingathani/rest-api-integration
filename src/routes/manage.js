const express = require('express');
const store = require('../store');

const router = express.Router();

// PATCH /api/data/:id — update an existing record (partial update)
router.patch('/data/:id', (req, res) => {
  const { id } = req.params;
  const existing = store.getById(id);

  if (!existing) {
    return res.status(404).json({
      error: 'Not found',
      message: `Record with id '${id}' not found`,
    });
  }

  const updates = req.body;

  if (typeof updates !== 'object' || updates === null || Array.isArray(updates)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Request body must be an object'],
    });
  }

  // Prevent changing the ID
  if (updates.id !== undefined && updates.id !== id) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Cannot change record id'],
    });
  }

  const updated = store.save({
    ...existing,
    ...updates,
    id, // preserve original id
    updatedAt: new Date().toISOString(),
  });

  res.json({
    message: 'Record updated successfully',
    record: updated,
  });
});

// DELETE /api/data/:id — remove a record
router.delete('/data/:id', (req, res) => {
  const { id } = req.params;
  const existing = store.getById(id);

  if (!existing) {
    return res.status(404).json({
      error: 'Not found',
      message: `Record with id '${id}' not found`,
    });
  }

  store.delete(id);

  res.json({
    message: 'Record deleted successfully',
    id,
  });
});

module.exports = router;
