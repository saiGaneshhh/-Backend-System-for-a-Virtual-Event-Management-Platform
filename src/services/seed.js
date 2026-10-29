const bcrypt = require('bcryptjs');
const { users, events, registrations } = require('../store');
const { id } = require('../utils');
async function seedDemoData() {
  if (users.length) return;
  const organizerId = id();
  const attendeeId = id();
  users.push(
    { id: organizerId, name: 'Demo Organizer', email: 'organizer@demo.com', passwordHash: await bcrypt.hash('Organizer123!', 10), role: 'organizer', createdAt: new Date().toISOString() },
    { id: attendeeId, name: 'Demo Attendee', email: 'attendee@demo.com', passwordHash: await bcrypt.hash('Attendee123!', 10), role: 'attendee', createdAt: new Date().toISOString() }
  );
  const now = new Date();
  const day = (offset) => { const d = new Date(now); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
  const samples = [
    { title: 'Building APIs with Node.js', description: 'A practical workshop covering Express, REST design, validation, and testing.', date: day(3), time: '10:00', timezone: 'Asia/Kolkata', capacity: 100, location: 'Online · Zoom', category: 'Technology' },
    { title: 'AI for Everyday Work', description: 'Explore useful AI workflows, responsible use, and hands-on examples.', date: day(7), time: '14:30', timezone: 'Asia/Kolkata', capacity: 150, location: 'Online · Google Meet', category: 'Artificial Intelligence' },
    { title: 'Product Design Meetup', description: 'A friendly session on research, prototyping, and design systems.', date: day(12), time: '17:00', timezone: 'Asia/Kolkata', capacity: 75, location: 'Online · Microsoft Teams', category: 'Design' }
  ];
  for (const sample of samples) events.push({ id: id(), ...sample, organizerId, participants: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  console.log('\n=== DEMO ACCOUNTS ===\nOrganizer: organizer@demo.com / Organizer123!\nAttendee:  attendee@demo.com / Attendee123!\nDemo events:', events.length, '\n=====================\n');
}
module.exports = { seedDemoData };
