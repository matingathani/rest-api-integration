# REST API Integration

![CI](https://github.com/matingathani/rest-api-integration/actions/workflows/ci.yml/badge.svg)

A REST API for data ingestion and retrieval with comprehensive validation, structured error responses, and 30 test cases.

## Features

- **5 endpoints** for ingesting and retrieving data
- **In-memory store** with O(1) ID lookups
- **Request validation** with detailed error messages
- **Structured JSON errors** with consistent format
- **30 Jest/Supertest tests** covering all scenarios
- **Postman collection** with 30 pre-built requests

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/data | Ingest a single record |
| POST | /api/batch | Ingest an array of records |
| GET | /api/data | Retrieve all records (optional `?type=` filter) |
| GET | /api/data/:id | Retrieve record by ID |
| GET | /api/stats | Aggregated stats (count by type, total) |
| PATCH | /api/data/:id | Update record by ID |
| DELETE | /api/data/:id | Delete record by ID |

## Quick Start

```bash
npm install
npm start
```

Server starts on port 3003.

## Running Tests

```bash
npm test
```

30 tests covering:
- Happy path for all 5 endpoints
- Missing required fields validation
- Invalid data types
- Edge cases (empty batch, duplicate ID, unknown ID)
- Filter/query parameters
- Error response format consistency

## Request Format

### Single Record
```json
{
  "id": "rec-001",
  "type": "sensor",
  "data": { "temperature": 23.5 },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Required fields:** `id` (string), `type` (string), `data` (any)

**Optional fields:** `timestamp` (ISO date string)

### Batch
```json
{
  "records": [
    { "id": "b-001", "type": "event", "data": { "name": "click" } },
    { "id": "b-002", "type": "event", "data": { "name": "scroll" } }
  ]
}
```

## Error Response Format

All errors follow a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "details": ["Specific validation error 1", "error 2"]
}
```

## Postman Collection

Import `postman/collection.json` into Postman. Set `baseUrl` variable to `http://localhost:3003`.
