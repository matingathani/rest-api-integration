function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return ['Record must be an object'];
  }

  if (!record.id) {
    errors.push('id is required');
  } else if (typeof record.id !== 'string') {
    errors.push('id must be a string');
  }

  if (!record.type) {
    errors.push('type is required');
  } else if (typeof record.type !== 'string') {
    errors.push('type must be a string');
  }

  if (!record.data) {
    errors.push('data is required');
  }

  if (record.timestamp !== undefined && isNaN(Date.parse(record.timestamp))) {
    errors.push('timestamp must be a valid ISO date string');
  }

  return errors;
}

function validateSingleRecord(req, res, next) {
  const errors = validateRecord(req.body);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }
  next();
}

function validateBatchRecords(req, res, next) {
  const { records } = req.body;

  if (!records) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['records array is required'],
    });
  }

  if (!Array.isArray(records)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['records must be an array'],
    });
  }

  const allErrors = [];

  records.forEach((record, index) => {
    const errors = validateRecord(record);
    if (errors.length > 0) {
      allErrors.push({ index, errors });
    }
  });

  if (allErrors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: allErrors,
    });
  }

  next();
}

module.exports = { validateSingleRecord, validateBatchRecords };
