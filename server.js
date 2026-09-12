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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/upload', uploadRoute);
app.use('/book', bookingRoute);
app.use('/api', apiRoute);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Recruiter Coordinator MVP running at http://localhost:${PORT}`);
});
