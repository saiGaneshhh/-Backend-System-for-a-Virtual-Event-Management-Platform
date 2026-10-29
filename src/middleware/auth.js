const jwt = require('jsonwebtoken');
const { users } = require('../store');
const { AppError } = require('./errors');
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new AppError(401, 'Authorization token required. Use Bearer <token>.');
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) throw new AppError(401, 'User session is no longer valid. Please log in again.');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError(401, 'Invalid or expired token. Please log in again.'));
  }
}
function organizerOnly(req, res, next) {
  if (req.user.role !== 'organizer') return next(new AppError(403, 'Only event organizers can perform this action.'));
  next();
}
module.exports = { authenticate, organizerOnly };
