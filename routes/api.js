// routes/api.js
// Read-only endpoints the dashboard polls to render current state.

const express = require('express');
const db = require('../db');
const calendarService = require('../services/calendarService');
const emailService = require('../services/emailService');

const router = express.Router();

router.get('/recruiters', (req, res) => {
  res.json(db.recruiters.all());
});

router.get('/candidates', (req, res) => {
  const candidates = db.candidates.all();
  const recruiters = db.recruiters.all();
  const withRecruiterName = candidates
    .map((c) => ({
      ...c,
      recruiterName: recruiters.find((r) => r.id === c.recruiterId)?.name || 'Unknown',
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(withRecruiterName);
});

router.get('/email-log', (req, res) => {
  const log = db.emailLog.all().slice(-50).reverse();
  res.json(log);
});

router.get('/status', (req, res) => {
  res.json({
    googleCalendarMode: calendarService.USE_REAL_GOOGLE ? 'live' : 'mock',
    emailMode: emailService.USE_REAL_EMAIL ? 'live' : 'mock',
  });
});

module.exports = router;
