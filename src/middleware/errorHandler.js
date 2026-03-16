function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
