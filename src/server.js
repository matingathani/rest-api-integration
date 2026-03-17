const express = require('express');
const ingestRoutes = require('./routes/ingest');
const retrieveRoutes = require('./routes/retrieve');
const manageRoutes = require('./routes/manage');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/api', ingestRoutes);
app.use('/api', retrieveRoutes);
app.use('/api', manageRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`REST API Integration server running on port ${PORT}`);
  });
}

module.exports = app;
