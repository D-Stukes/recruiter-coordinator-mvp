// routes/upload.js
// Step 1: recruiter uploads CSV of candidates + picks themselves from a
// dropdown + clicks "Start Scheduling."

const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const scheduler = require('../services/scheduler');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function baseUrlFor(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Accepts a CSV with header row containing "name" and "email" columns
// (case-insensitive, order-independent).
function parseCandidatesCsv(buffer) {
  const records = parse(buffer.toString('utf-8'), {
    columns: (header) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((r) => ({ name: r.name || r['full name'] || '', email: r.email || '' }))
    .filter((r) => r.name && r.email);
}

router.post('/', upload.single('csvFile'), async (req, res) => {
  try {
    const { recruiterId } = req.body;
    if (!recruiterId) {
      return res.status(400).json({ error: 'recruiterId is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'csvFile is required' });
    }

    const recruiter = db.recruiters.find(recruiterId);
    if (!recruiter) {
      return res.status(400).json({ error: 'Unknown recruiter' });
    }

    const rows = parseCandidatesCsv(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({
        error: 'No valid rows found. CSV needs "name" and "email" columns.',
      });
    }

    const now = new Date().toISOString();
    const candidates = rows.map((r) => ({
      id: uuidv4(),
      name: r.name,
      email: r.email,
      recruiterId,
      status: 'PENDING',
      slots: [],
      bookingToken: null,
      bookedSlot: null,
      calendarEventId: null,
      createdAt: now,
      updatedAt: now,
    }));

    db.candidates.saveMany(candidates);

    // Kick off Step 2/3 for the whole batch (fires the first candidate
    // immediately, per the spec, then continues through the rest).
    const baseUrl = baseUrlFor(req);
    scheduler
      .processBatch(
        candidates.map((c) => c.id),
        baseUrl
      )
      .catch((err) => console.error('[upload] batch processing error:', err));

    res.json({
      message: `Uploaded ${candidates.length} candidate(s). Scheduling started.`,
      candidateIds: candidates.map((c) => c.id),
    });
  } catch (err) {
    console.error('[upload] error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
