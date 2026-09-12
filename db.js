// db.js
// Minimal file-backed "database" for the MVP.
// Swap this out for Postgres/Mongo/etc. post-MVP — the interface below
// (getAll/save) is the only thing the rest of the app touches.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  recruiters: path.join(DATA_DIR, 'recruiters.json'),
  candidates: path.join(DATA_DIR, 'candidates.json'),
  emailLog: path.join(DATA_DIR, 'email_log.json'),
};

function ensureFile(file, defaultValue) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
}

function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  ensureFile(FILES.recruiters, [
    { id: 'rec_1', name: 'Alex Rivera', email: 'alex.rivera@example.com' },
    { id: 'rec_2', name: 'Jordan Chen', email: 'jordan.chen@example.com' },
    { id: 'rec_3', name: 'Sam Patel', email: 'sam.patel@example.com' },
  ]);
  ensureFile(FILES.candidates, []);
  ensureFile(FILES.emailLog, []);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Generic collection helpers
const collections = {
  recruiters: {
    all: () => readJson(FILES.recruiters),
    find: (id) => collections.recruiters.all().find((r) => r.id === id),
  },
  candidates: {
    all: () => readJson(FILES.candidates),
    find: (id) => collections.candidates.all().find((c) => c.id === id),
    save: (candidate) => {
      const list = collections.candidates.all();
      const idx = list.findIndex((c) => c.id === candidate.id);
      if (idx >= 0) list[idx] = candidate;
      else list.push(candidate);
      writeJson(FILES.candidates, list);
      return candidate;
    },
    saveMany: (candidates) => {
      const list = collections.candidates.all();
      candidates.forEach((c) => list.push(c));
      writeJson(FILES.candidates, list);
      return candidates;
    },
  },
  emailLog: {
    all: () => readJson(FILES.emailLog),
    append: (entry) => {
      const list = collections.emailLog.all();
      list.push(entry);
      writeJson(FILES.emailLog, list);
      return entry;
    },
  },
};

module.exports = { init, ...collections };
