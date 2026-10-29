require('dotenv').config();
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'local-demo-secret-change-before-deploy-2026';
const app = require('./app');
const { seedDemoData } = require('./services/seed');
const port = Number(process.env.PORT || 5000);
seedDemoData().then(() => app.listen(port, () => console.log(`Virtual Event API listening at http://localhost:${port}\nHealth check: http://localhost:${port}/health`))).catch(err => { console.error('Unable to seed demo data:', err); process.exit(1); });
