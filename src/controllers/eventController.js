const { users, events, registrations } = require('../store');
const { id } = require('../utils');
const { AppError } = require('../middleware/errors');
const { sendRegistrationEmail } = require('../services/emailService');
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
function validateEvent(body) {
  const { title, description, date, time } = body;
  if (!title || typeof title !== 'string' || title.trim().length < 3) throw new AppError(400, 'Title must contain at least 3 characters.');
  if (!description || typeof description !== 'string' || description.trim().length < 10) throw new AppError(400, 'Description must contain at least 10 characters.');
  if (!validDate(date)) throw new AppError(400, 'Date must use YYYY-MM-DD format.');
  if (!validTime(time)) throw new AppError(400, 'Time must use 24-hour HH:mm format.');
  if (body.capacity !== undefined && (!Number.isInteger(Number(body.capacity)) || Number(body.capacity) < 1)) throw new AppError(400, 'Capacity must be a positive integer.');
}
function publicEvent(event) {
  return { ...event, participantCount: event.participants.length, participants: event.participants.map(p => ({ userId: p.userId, name: p.name, registeredAt: p.registeredAt })) };
}
function listEvents(req, res) {
  let result = events;
  if (req.query.category) result = result.filter(e => e.category.toLowerCase() === String(req.query.category).toLowerCase());
  if (req.query.date) result = result.filter(e => e.date === req.query.date);
  res.json({ success: true, count: result.length, events: result.map(publicEvent) });
}
function getEvent(req, res, next) {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return next(new AppError(404, 'Event not found.'));
  res.json({ success: true, event: publicEvent(event) });
}
function createEvent(req, res, next) {
  try {
    validateEvent(req.body || {});
    const body = req.body;
    const event = { id: id(), title: body.title.trim(), description: body.description.trim(), date: body.date, time: body.time, timezone: body.timezone || 'Asia/Kolkata', category: body.category || 'General', location: body.location || 'Online', capacity: body.capacity === undefined ? 100 : Number(body.capacity), organizerId: req.user.id, participants: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    events.push(event);
    res.status(201).json({ success: true, message: 'Event created.', event: publicEvent(event) });
  } catch (err) { next(err); }
}
function updateEvent(req, res, next) {
  try {
    const event = events.find(e => e.id === req.params.id);
    if (!event) throw new AppError(404, 'Event not found.');
    if (event.organizerId !== req.user.id) throw new AppError(403, 'You can only update events you created.');
    const body = req.body || {};
    const merged = { ...event, ...body };
    validateEvent(merged);
    for (const key of ['title', 'description', 'date', 'time', 'timezone', 'category', 'location', 'capacity']) {
      if (body[key] !== undefined) event[key] = key === 'capacity' ? Number(body[key]) : (typeof body[key] === 'string' && ['title', 'description'].includes(key) ? body[key].trim() : body[key]);
    }
    if (event.capacity < event.participants.length) throw new AppError(400, 'Capacity cannot be lower than current participant count.');
    event.updatedAt = new Date().toISOString();
    res.json({ success: true, message: 'Event updated.', event: publicEvent(event) });
  } catch (err) { next(err); }
}
function deleteEvent(req, res, next) {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index < 0) return next(new AppError(404, 'Event not found.'));
  if (events[index].organizerId !== req.user.id) return next(new AppError(403, 'You can only delete events you created.'));
  const [removed] = events.splice(index, 1);
  for (let i = registrations.length - 1; i >= 0; i--) if (registrations[i].eventId === removed.id) registrations.splice(i, 1);
  res.json({ success: true, message: 'Event deleted.' });
}
async function registerForEvent(req, res, next) {
  try {
    const event = events.find(e => e.id === req.params.id);
    if (!event) throw new AppError(404, 'Event not found.');
    if (req.user.role !== 'attendee') throw new AppError(403, 'Only attendees can register for events.');
    if (event.organizerId === req.user.id) throw new AppError(400, 'Organizers cannot register for their own event.');
    if (event.participants.some(p => p.userId === req.user.id)) throw new AppError(409, 'You are already registered for this event.');
    if (event.participants.length >= event.capacity) throw new AppError(409, 'This event is full.');
    const registration = { id: id(), eventId: event.id, userId: req.user.id, registeredAt: new Date().toISOString(), status: 'registered' };
    event.participants.push({ userId: req.user.id, name: req.user.name, registeredAt: registration.registeredAt });
    registrations.push(registration);
    let email;
    try { email = await sendRegistrationEmail({ to: req.user.email, attendeeName: req.user.name, event }); }
    catch (err) { console.error('[email] notification failed:', err.message); email = { delivered: false, mode: 'failed', message: 'Registration succeeded, but email notification failed.' }; }
    res.status(201).json({ success: true, message: 'Event registration successful.', registration, event: { id: event.id, title: event.title, date: event.date, time: event.time }, email });
  } catch (err) { next(err); }
}
function myRegistrations(req, res) {
  const mine = registrations.filter(r => r.userId === req.user.id).map(r => ({ ...r, event: (() => { const e = events.find(ev => ev.id === r.eventId); return e ? { id: e.id, title: e.title, date: e.date, time: e.time, location: e.location } : null; })() }));
  res.json({ success: true, count: mine.length, registrations: mine });
}
function cancelRegistration(req, res, next) {
  const index = registrations.findIndex(r => r.eventId === req.params.id && r.userId === req.user.id);
  if (index < 0) return next(new AppError(404, 'You are not registered for this event.'));
  registrations.splice(index, 1);
  const event = events.find(e => e.id === req.params.id);
  if (event) event.participants = event.participants.filter(p => p.userId !== req.user.id);
  res.json({ success: true, message: 'Registration cancelled.' });
}
module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent, registerForEvent, myRegistrations, cancelRegistration };
