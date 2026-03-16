const request = require('supertest');
const app = require('../src/server');
const store = require('../src/store');

beforeEach(() => {
  store.clear();
});

// ============================================================
// 1. Happy path for all 5 endpoints (5 tests)
// ============================================================

describe('Happy path', () => {
  test('POST /api/data — ingests single record', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 'rec-1', type: 'sensor', data: { value: 42 } });

    expect(res.status).toBe(201);
    expect(res.body.record.id).toBe('rec-1');
    expect(res.body.record.type).toBe('sensor');
  });

  test('POST /api/batch — ingests multiple records', async () => {
    const res = await request(app)
      .post('/api/batch')
      .send({
        records: [
          { id: 'b-1', type: 'event', data: { name: 'click' } },
          { id: 'b-2', type: 'event', data: { name: 'scroll' } },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    expect(res.body.records).toHaveLength(2);
  });

  test('GET /api/data — retrieves all records', async () => {
    await request(app).post('/api/data').send({ id: 'r-1', type: 'log', data: {} });
    await request(app).post('/api/data').send({ id: 'r-2', type: 'log', data: {} });

    const res = await request(app).get('/api/data');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.records).toHaveLength(2);
  });

  test('GET /api/data/:id — retrieves record by ID', async () => {
    await request(app).post('/api/data').send({ id: 'find-me', type: 'test', data: { x: 1 } });

    const res = await request(app).get('/api/data/find-me');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('find-me');
    expect(res.body.type).toBe('test');
  });

  test('GET /api/stats — returns aggregated statistics', async () => {
    await request(app).post('/api/data').send({ id: 's-1', type: 'event', data: {} });
    await request(app).post('/api/data').send({ id: 's-2', type: 'event', data: {} });
    await request(app).post('/api/data').send({ id: 's-3', type: 'sensor', data: {} });

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.countByType.event).toBe(2);
    expect(res.body.countByType.sensor).toBe(1);
  });
});

// ============================================================
// 2. Missing required fields validation (5 tests)
// ============================================================

describe('Missing required fields', () => {
  test('POST /api/data — missing id', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ type: 'event', data: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toContain('id is required');
  });

  test('POST /api/data — missing type', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 'x-1', data: {} });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('type is required');
  });

  test('POST /api/data — missing data', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 'x-1', type: 'event' });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('data is required');
  });

  test('POST /api/batch — missing records field', async () => {
    const res = await request(app)
      .post('/api/batch')
      .send({ something: 'else' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('POST /api/batch — record in array missing id', async () => {
    const res = await request(app)
      .post('/api/batch')
      .send({ records: [{ type: 'event', data: {} }] });

    expect(res.status).toBe(400);
    expect(res.body.details[0].errors).toContain('id is required');
  });
});

// ============================================================
// 3. Invalid data types (5 tests)
// ============================================================

describe('Invalid data types', () => {
  test('POST /api/data — id is not a string', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 123, type: 'event', data: {} });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('id must be a string');
  });

  test('POST /api/data — type is not a string', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 'x-1', type: 99, data: {} });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('type must be a string');
  });

  test('POST /api/data — invalid timestamp format', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ id: 'x-1', type: 'event', data: {}, timestamp: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('timestamp must be a valid ISO date string');
  });

  test('POST /api/batch — records is not an array', async () => {
    const res = await request(app)
      .post('/api/batch')
      .send({ records: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('records must be an array');
  });

  test('POST /api/data — non-object body', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('Content-Type', 'application/json')
      .send('null');

    expect(res.status).toBe(400);
  });
});

// ============================================================
// 4. Edge cases (5 tests)
// ============================================================

describe('Edge cases', () => {
  test('POST /api/batch — empty records array', async () => {
    const res = await request(app)
      .post('/api/batch')
      .send({ records: [] });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('records array cannot be empty');
  });

  test('POST /api/data — duplicate ID returns 409', async () => {
    await request(app).post('/api/data').send({ id: 'dup-id', type: 'x', data: {} });

    const res = await request(app)
      .post('/api/data')
      .send({ id: 'dup-id', type: 'y', data: {} });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  test('POST /api/batch — batch with duplicate ID returns 409', async () => {
    await request(app).post('/api/data').send({ id: 'existing', type: 'x', data: {} });

    const res = await request(app)
      .post('/api/batch')
      .send({ records: [{ id: 'existing', type: 'y', data: {} }] });

    expect(res.status).toBe(409);
    expect(res.body.duplicateIds).toContain('existing');
  });

  test('GET /api/data/:id — unknown ID returns 404', async () => {
    const res = await request(app).get('/api/data/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  test('GET /api/stats — empty store returns zeros', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.countByType).toEqual({});
  });
});

// ============================================================
// 5. Filter/query params (5 tests)
// ============================================================

describe('Filter and query params', () => {
  beforeEach(async () => {
    await request(app).post('/api/data').send({ id: 'f-1', type: 'event', data: {} });
    await request(app).post('/api/data').send({ id: 'f-2', type: 'event', data: {} });
    await request(app).post('/api/data').send({ id: 'f-3', type: 'sensor', data: {} });
    await request(app).post('/api/data').send({ id: 'f-4', type: 'log', data: {} });
  });

  test('GET /api/data?type=event — filters by type', async () => {
    const res = await request(app).get('/api/data?type=event');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.records.every((r) => r.type === 'event')).toBe(true);
  });

  test('GET /api/data?type=sensor — filters sensor type', async () => {
    const res = await request(app).get('/api/data?type=sensor');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.records[0].id).toBe('f-3');
  });

  test('GET /api/data?type=nonexistent — returns empty array', async () => {
    const res = await request(app).get('/api/data?type=nonexistent');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.records).toHaveLength(0);
  });

  test('GET /api/data — without filter returns all records', async () => {
    const res = await request(app).get('/api/data');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
  });

  test('GET /api/stats — countByType reflects all types', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.body.total).toBe(4);
    expect(res.body.countByType.event).toBe(2);
    expect(res.body.countByType.sensor).toBe(1);
    expect(res.body.countByType.log).toBe(1);
  });
});

// ============================================================
// 6. Error response format consistency (5 tests)
// ============================================================

describe('Error response format', () => {
  test('400 errors have error and details fields', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ type: 'event', data: {} });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  test('404 errors have error and message fields', async () => {
    const res = await request(app).get('/api/data/unknown-id');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  test('409 conflicts have error and message fields', async () => {
    await request(app).post('/api/data').send({ id: 'conflict', type: 'x', data: {} });
    const res = await request(app).post('/api/data').send({ id: 'conflict', type: 'y', data: {} });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });

  test('All error responses are JSON', async () => {
    const res = await request(app)
      .get('/api/data/not-here')
      .set('Accept', 'application/json');

    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toBeInstanceOf(Object);
  });

  test('Route not found returns 404 with error field', async () => {
    const res = await request(app).get('/api/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
