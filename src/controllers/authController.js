const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../store');
const { id, safeUser } = require('../utils');
const { AppError } = require('../middleware/errors');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'attendee' } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 2) throw new AppError(400, 'Name must contain at least 2 characters.');
    if (!email || typeof email !== 'string' || !emailPattern.test(email)) throw new AppError(400, 'A valid email address is required.');
    if (!password || typeof password !== 'string' || password.length < 8) throw new AppError(400, 'Password must be at least 8 characters.');
    if (!['attendee', 'organizer'].includes(role)) throw new AppError(400, 'Role must be attendee or organizer.');
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some(u => u.email === normalizedEmail)) throw new AppError(409, 'An account with this email already exists.');
    const user = { id: id(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10), role, createdAt: new Date().toISOString() };
    users.push(user);
    res.status(201).json({ success: true, message: 'Registration successful.', user: safeUser(user) });
  } catch (err) { next(err); }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError(400, 'Email and password are required.');
    const user = users.find(u => u.email === String(email).trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Invalid email or password.');
    const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.json({ success: true, message: 'Login successful.', token, tokenType: 'Bearer', expiresIn: process.env.JWT_EXPIRES_IN || '1d', user: safeUser(user) });
  } catch (err) { next(err); }
}
module.exports = { register, login };
