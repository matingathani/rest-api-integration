// In-memory data store using Map for O(1) lookups by ID
class DataStore {
  constructor() {
    this.data = new Map();
  }

  getAll() {
    return Array.from(this.data.values());
  }

  getById(id) {
    return this.data.get(id) || null;
  }

  save(record) {
    this.data.set(record.id, record);
    return record;
  }

  saveMany(records) {
    records.forEach((r) => this.data.set(r.id, r));
    return records;
  }

  has(id) {
    return this.data.has(id);
  }

  getStats() {
    const all = this.getAll();
    const countByType = {};

    all.forEach((record) => {
      const type = record.type || 'unknown';
      countByType[type] = (countByType[type] || 0) + 1;
    });

    return {
      total: all.length,
      countByType,
    };
  }

  clear() {
    this.data.clear();
  }
}

module.exports = new DataStore();
