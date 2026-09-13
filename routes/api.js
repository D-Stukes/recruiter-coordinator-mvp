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

router.get('/candidates', async (req, res) => {
  try {
    const candidates = await db.candidates.all();
    const recruiters = db.recruiters.all();
    const withRecruiterName = candidates.map((c) => ({
      ...c,
      recruiterName: recruiters.find((r) => r.id === c.recruiterId)?.name || 'Unknown',
    }));

    // Booked candidates are the ones a recruiter most needs to confirm at a
    // glance, so they float to the top (most recently booked first),
    // regardless of when they were originally uploaded. Everything else
    // keeps the previous newest-upload-first ordering.
    withRecruiterName.sort((a, b) => {
      const aBooked = a.status === 'BOOKED';
      const bBooked = b.status === 'BOOKED';
      if (aBooked !== bBooked) return aBooked ? -1 : 1;
      const dateField = aBooked ? 'updatedAt' : 'createdAt';
      return new Date(b[dateField]) - new Date(a[dateField]);
    });

    res.json(withRecruiterName);
  } catch (err) {
    console.error('[api] /candidates error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/email-log', async (req, res) => {
  try {
    const log = (await db.emailLog.all()).slice(-50).reverse();
    res.json(log);
  } catch (err) {
    console.error('[api] /email-log error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    googleCalendarMode: calendarService.USE_REAL_GOOGLE ? 'live' : 'mock',
    emailMode: emailService.USE_REAL_EMAIL ? 'live' : 'mock',
  });
});

module.exports = router;
