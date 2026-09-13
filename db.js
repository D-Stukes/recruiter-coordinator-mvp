// db.js
// Two storage modes, auto-selected by environment -- same pattern this
// codebase already uses for calendarService/emailService (mock vs. live):
//
//  - Local file mode (default): reads/writes data/*.json on disk. This is
//    what runs locally and on Render, exactly as before.
//  - Postgres mode: when DATABASE_URL is present (Vercel injects this
//    automatically once a Postgres integration -- e.g. Neon -- is linked
//    to the project via the Vercel Marketplace), reads/writes go to two
//    real tables instead. This is required on Vercel specifically,
//    because serverless functions don't share a persistent local disk
//    between requests -- a locally-written JSON file there would not
//    reliably survive to the next request.
//
// Every method below is async and must be awaited, in both modes, so
// calling code never needs to know or care which mode is active.

const fs = require('fs');
const path = require('path');

const USE_SQL = !!process.env.DATABASE_URL;

// Recruiters are fixed seed data (there's no sign-up flow in this MVP),
// so they don't need real persistence in either mode -- just a constant.
const RECRUITERS = [
  { id: 'rec_1', name: 'Alex Rivera', email: 'alex.rivera@example.com' },
  { id: 'rec_2', name: 'Jordan Chen', email: 'jordan.chen@example.com' },
  { id: 'rec_3', name: 'Sam Patel', email: 'sam.patel@example.com' },
];

// ---------------- Postgres mode ----------------

let Client;
if (USE_SQL) {
  // Only required in SQL mode, so local/Render installs don't need it.
  ({ Client } = require('pg'));
}

// A fresh client per operation (rather than a long-lived pool) keeps this
// safe under serverless functions, where each invocation may run in a new,
// short-lived process -- there's no good place to keep a pool alive
// between them anyway.
async function withClient(fn) {
  const needsSsl = process.env.DATABASE_URL.includes('sslmode=require');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = withClient(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS candidates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          recruiter_id TEXT NOT NULL,
          status TEXT NOT NULL,
          slots JSONB NOT NULL DEFAULT '[]',
          booking_token TEXT,
          booked_slot JSONB,
          calendar_event_id TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_log (
          id SERIAL PRIMARY KEY,
          to_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          sent_at TIMESTAMPTZ NOT NULL,
          mock BOOLEAN NOT NULL DEFAULT true
        )
      `);
    });
  }
  return schemaReady;
}

function rowToCandidate(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    recruiterId: row.recruiter_id,
    status: row.status,
    slots: row.slots || [],
    bookingToken: row.booking_token,
    bookedSlot: row.booked_slot,
    calendarEventId: row.calendar_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function sqlUpsertCandidate(client, candidate) {
  await client.query(
    `INSERT INTO candidates
       (id, name, email, recruiter_id, status, slots, booking_token, booked_slot, calendar_event_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       recruiter_id = EXCLUDED.recruiter_id,
       status = EXCLUDED.status,
       slots = EXCLUDED.slots,
       booking_token = EXCLUDED.booking_token,
       booked_slot = EXCLUDED.booked_slot,
       calendar_event_id = EXCLUDED.calendar_event_id,
       updated_at = EXCLUDED.updated_at`,
    [
      candidate.id,
      candidate.name,
      candidate.email,
      candidate.recruiterId,
      candidate.status,
      JSON.stringify(candidate.slots || []),
      candidate.bookingToken,
      candidate.bookedSlot ? JSON.stringify(candidate.bookedSlot) : null,
      candidate.calendarEventId,
      candidate.createdAt,
      candidate.updatedAt,
    ]
  );
}

// ---------------- Local file mode ----------------

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  candidates: path.join(DATA_DIR, 'candidates.json'),
  emailLog: path.join(DATA_DIR, 'email_log.json'),
};

function ensureFile(file, defaultValue) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
}

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function init() {
  if (USE_SQL) {
    // Kick off table creation in the background; every exported function
    // below awaits the same cached promise before touching the tables, so
    // this doesn't need to block startup or be awaited here.
    ensureSchema().catch((err) => console.error('[db] schema setup failed:', err));
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  ensureFile(FILES.candidates, []);
  ensureFile(FILES.emailLog, []);
}

// ---------------- Candidates ----------------

async function candidatesAll() {
  if (USE_SQL) {
    await ensureSchema();
    return withClient(async (client) => {
      const { rows } = await client.query('SELECT * FROM candidates ORDER BY created_at DESC');
      return rows.map(rowToCandidate);
    });
  }
  return readJsonFile(FILES.candidates);
}

async function candidatesFind(id) {
  if (USE_SQL) {
    await ensureSchema();
    return withClient(async (client) => {
      const { rows } = await client.query('SELECT * FROM candidates WHERE id = $1', [id]);
      return rows[0] ? rowToCandidate(rows[0]) : undefined;
    });
  }
  const list = readJsonFile(FILES.candidates);
  return list.find((c) => c.id === id);
}

async function candidatesSave(candidate) {
  if (USE_SQL) {
    await ensureSchema();
    await withClient((client) => sqlUpsertCandidate(client, candidate));
    return candidate;
  }

  const list = readJsonFile(FILES.candidates);
  const idx = list.findIndex((c) => c.id === candidate.id);
  if (idx >= 0) list[idx] = candidate;
  else list.push(candidate);
  writeJsonFile(FILES.candidates, list);
  return candidate;
}

async function candidatesSaveMany(newCandidates) {
  if (USE_SQL) {
    await ensureSchema();
    await withClient(async (client) => {
      for (const c of newCandidates) {
        await sqlUpsertCandidate(client, c);
      }
    });
    return newCandidates;
  }

  const list = readJsonFile(FILES.candidates);
  newCandidates.forEach((c) => list.push(c));
  writeJsonFile(FILES.candidates, list);
  return newCandidates;
}

// ---------------- Email log ----------------

async function emailLogAll() {
  if (USE_SQL) {
    await ensureSchema();
    return withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT to_email AS "to", subject, body AS "text", sent_at AS "sentAt", mock
         FROM email_log ORDER BY sent_at ASC`
      );
      return rows;
    });
  }
  return readJsonFile(FILES.emailLog);
}

async function emailLogAppend(entry) {
  if (USE_SQL) {
    await ensureSchema();
    await withClient((client) =>
      client.query(
        'INSERT INTO email_log (to_email, subject, body, sent_at, mock) VALUES ($1, $2, $3, $4, $5)',
        [entry.to, entry.subject, entry.text, entry.sentAt, !!entry.mock]
      )
    );
    return entry;
  }

  const list = readJsonFile(FILES.emailLog);
  list.push(entry);
  writeJsonFile(FILES.emailLog, list);
  return entry;
}

module.exports = {
  init,
  USE_SQL,
  recruiters: {
    all: () => RECRUITERS,
    find: (id) => RECRUITERS.find((r) => r.id === id),
  },
  candidates: {
    all: candidatesAll,
    find: candidatesFind,
    save: candidatesSave,
    saveMany: candidatesSaveMany,
  },
  emailLog: {
    all: emailLogAll,
    append: emailLogAppend,
  },
};
