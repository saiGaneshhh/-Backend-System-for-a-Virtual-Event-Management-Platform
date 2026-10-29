# Virtual Event Management API

A demo-ready REST API built with Node.js, Express, bcrypt, JWT, and in-memory arrays. It supports attendee/organizer accounts, event CRUD, event registration, registration management, and email confirmation (console demo by default).

## Features

- Register and log in with bcrypt password hashing and JWT sessions.
- Role-based access: organizers manage their own events; attendees register for events.
- List and view events, filter by `category` or `date`, update/delete events, and manage registrations.
- Registration confirmation email via SMTP, or a simulated email printed to the terminal when SMTP is not configured.
- Input validation, request logging, CORS, async email operations, and centralized error responses.
- Three sample events and two demo accounts seeded automatically on startup.

> **In-memory storage:** users, events, and registrations reset whenever the server restarts. This is intended for learning and demonstrations, not production use.

## Requirements and setup

Node.js 18 or newer is recommended.

```bash
npm install
```

Create `.env` from the sample file:

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux**
```bash
cp .env.example .env
```

Start the API:
```bash
npm start
```

For development with automatic restart:
```bash
npm run dev
```

Base URL: `http://localhost:5000`
Health check: `GET http://localhost:5000/health`

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Organizer | `organizer@demo.com` | `Organizer123!` |
| Attendee | `attendee@demo.com` | `Attendee123!` |

The server seeds three sample events at startup. Use the organizer account to create, update, or delete events and the attendee account to register.

## Authentication

After logging in, copy the `token` from the response. For protected endpoints, include:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## API endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server health check |
| POST | `/register` | Public | Create attendee or organizer account |
| POST | `/login` | Public | Log in and receive JWT |
| GET | `/me` | Authenticated | Get current user profile |
| GET | `/events` | Public | List events; optional `?category=Technology` or `?date=YYYY-MM-DD` |
| GET | `/events/:id` | Public | View one event |
| POST | `/events` | Organizer | Create an event |
| PUT | `/events/:id` | Organizer/owner | Update an event you own |
| DELETE | `/events/:id` | Organizer/owner | Delete an event you own |
| POST | `/events/:id/register` | Attendee | Register for an event and trigger confirmation email |
| DELETE | `/events/:id/register` | Authenticated | Cancel your registration |
| GET | `/events/my/registrations` | Authenticated | List your registrations |

### Example event body

```json
{
  "title": "Node.js API Workshop",
  "description": "A practical workshop about Express REST APIs and JWT authentication.",
  "date": "2027-01-20",
  "time": "10:30",
  "timezone": "Asia/Kolkata",
  "category": "Technology",
  "location": "Online - Zoom",
  "capacity": 100
}
```

Dates use `YYYY-MM-DD`; times use 24-hour `HH:mm` format.

## cURL walkthrough

Commands below use Bash-compatible quoting. On Windows, run them in Git Bash or adapt the JSON quoting for PowerShell.

### 1. Health check

```bash
curl http://localhost:5000/health
```

### 2. Log in as organizer

```bash
curl -X POST http://localhost:5000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"organizer@demo.com","password":"Organizer123!"}'
```

Copy the returned token and set it in your terminal:

```bash
export ORG_TOKEN='paste-organizer-token-here'
```

PowerShell equivalent: `$env:ORG_TOKEN = 'paste-organizer-token-here'`.

### 3. List demo events

```bash
curl http://localhost:5000/events
```

### 4. Create an event

```bash
curl -X POST http://localhost:5000/events \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{"title":"Node.js API Workshop","description":"A practical workshop about Express REST APIs and JWT authentication.","date":"2027-01-20","time":"10:30","category":"Technology","location":"Online - Zoom","capacity":100}'
```

Copy the created event's `id` and use it as `EVENT_ID` below.

### 5. Log in as attendee

```bash
curl -X POST http://localhost:5000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"attendee@demo.com","password":"Attendee123!"}'
```

Set the token:
```bash
export ATTENDEE_TOKEN='paste-attendee-token-here'
export EVENT_ID='paste-event-id-here'
```

### 6. Register for an event

```bash
curl -X POST "http://localhost:5000/events/$EVENT_ID/register" \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"
```

Without SMTP settings, the server prints a demo confirmation email to its terminal. Registration still succeeds.

### 7. View your registrations

```bash
curl http://localhost:5000/events/my/registrations \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"
```

### 8. Update an event

```bash
curl -X PUT "http://localhost:5000/events/$EVENT_ID" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ORG_TOKEN" \
  -d '{"title":"Updated Node.js Workshop","description":"Updated workshop details covering Express APIs, JWT authentication, and testing.","date":"2027-01-21","time":"11:00"}'
```

### 9. Cancel registration

```bash
curl -X DELETE "http://localhost:5000/events/$EVENT_ID/register" \
  -H "Authorization: Bearer $ATTENDEE_TOKEN"
```

### 10. Delete an event

```bash
curl -X DELETE "http://localhost:5000/events/$EVENT_ID" \
  -H "Authorization: Bearer $ORG_TOKEN"
```

## Configure real email (optional)

Set these values in `.env` to send actual email notifications using an SMTP provider:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=Virtual Events <you@example.com>
```

Use credentials from your email provider; do not commit `.env` or expose SMTP passwords. When SMTP is not configured, notifications are simulated in the console.

## Tests

```bash
npm test
```

Tests use Node's built-in test runner and Supertest to cover health, validation, organizer event creation, attendee registration, role permissions, and authentication. `supertest` is installed with the development dependencies.

## Project structure

```text
virtual-event-platform/
├── src/
│   ├── controllers/       # Auth and event request handlers
│   ├── middleware/       # JWT, role checks, and error handling
│   ├── routes/            # Auth and event route definitions
│   ├── services/          # Demo seed data and email notifications
│   ├── app.js             # Express app and middleware
│   ├── server.js          # Environment, seed, and server startup
│   ├── store.js           # In-memory arrays
│   └── utils.js           # IDs and safe user serialization
├── test/api.test.js
├── .env.example
├── package.json
└── README.md
```

## Important security note

This is a demonstration project. A fallback JWT secret is provided for local use only; set a long random `JWT_SECRET` in `.env` before sharing or deploying. In production, use a database, stronger operational controls, HTTPS, and validated SMTP settings. Registration currently allows a user to select the `organizer` role for easy local demos; a public production service should restrict organizer privileges to trusted/admin-approved users.
