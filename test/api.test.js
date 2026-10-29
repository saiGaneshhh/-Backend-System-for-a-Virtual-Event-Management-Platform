process.env.JWT_SECRET = 'test-secret-for-api-tests';
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { seedDemoData } = require('../src/services/seed');
let organizerToken, attendeeToken, eventId;
before(async () => {
  await seedDemoData();
  const org = await request(app).post('/login').send({ email: 'organizer@demo.com', password: 'Organizer123!' });
  const att = await request(app).post('/login').send({ email: 'attendee@demo.com', password: 'Attendee123!' });
  organizerToken = org.body.token; attendeeToken = att.body.token;
});
test('GET /health responds successfully', async () => {
  const res = await request(app).get('/health'); assert.equal(res.status, 200); assert.equal(res.body.status, 'ok');
});
test('registration validates email and password', async () => {
  const res = await request(app).post('/register').send({ name: 'Bad User', email: 'not-an-email', password: '123' }); assert.equal(res.status, 400);
});
test('organizer can create event', async () => {
  const res = await request(app).post('/events').set('Authorization', `Bearer ${organizerToken}`).send({ title: 'Test Event', description: 'A sufficiently long event description.', date: '2027-01-20', time: '10:30', capacity: 20 });
  assert.equal(res.status, 201); eventId = res.body.event.id;
});
test('attendee can register and view registrations', async () => {
  const res = await request(app).post(`/events/${eventId}/register`).set('Authorization', `Bearer ${attendeeToken}`); assert.equal(res.status, 201);
  const mine = await request(app).get('/events/my/registrations').set('Authorization', `Bearer ${attendeeToken}`); assert.equal(mine.status, 200); assert.ok(mine.body.count >= 1);
});
test('attendee cannot create events', async () => {
  const res = await request(app).post('/events').set('Authorization', `Bearer ${attendeeToken}`).send({ title: 'Forbidden Event', description: 'This should not be allowed.', date: '2027-01-20', time: '10:30' }); assert.equal(res.status, 403);
});
test('protected route rejects missing token', async () => {
  const res = await request(app).get('/me'); assert.equal(res.status, 401);
});
