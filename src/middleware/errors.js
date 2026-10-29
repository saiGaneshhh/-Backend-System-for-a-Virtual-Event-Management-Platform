class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err.message);
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : err.message });
}
module.exports = { AppError, notFound, errorHandler };
