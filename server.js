// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');

const db = require('./db');
db.init();

const uploadRoute = require('./routes/upload');
const bookingRoute = require('./routes/booking');
const apiRoute = require('./routes/api');

const app = express();
app.use(express.json());

// The React dashboard is built by `frontend` (npm run build) into
// public_dist/. See README.md for the dev vs. production workflow.
const FRONTEND_DIST = path.join(__dirname, 'public_dist');
app.use(express.static(FRONTEND_DIST));

app.use('/api/upload', uploadRoute);
app.use('/book', bookingRoute);
app.use('/api', apiRoute);

app.get('/health', (req, res) => res.json({ ok: true }));

// SPA fallback: any non-API/non-book GET request serves the React app,
// so a hard refresh on a future client-side route still works.
app.get(/^(?!\/api|\/book|\/health).*/, (req, res, next) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Recruiter Coordinator MVP running at http://localhost:${PORT}`);
});
