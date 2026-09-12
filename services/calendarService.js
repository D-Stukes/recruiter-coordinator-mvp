// services/calendarService.js
//
// Step 2 of the flow: "The Availability Parser Runs."
// This module has exactly two jobs:
//   1. getAvailableSlots(recruiter) -> first 3 open 30-min slots in the next 3 days
//   2. bookSlot(recruiter, candidate, slot) -> lock the event on the recruiter's calendar
//
// MVP DEFAULT: runs in MOCK MODE (no Google credentials needed) so the whole
// loop (upload -> email -> book -> calendar lock) can be demoed end-to-end today.
//
// TO GO LIVE WITH REAL GOOGLE CALENDAR:
//   1. npm install googleapis
//   2. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN (or a
//      service account) in .env, per recruiter (store the refresh token on the
//      recruiter record instead of a global env var once you have >1 recruiter).
//   3. Replace the two function bodies below with the commented-out
//      googleapis calls. Nothing else in the app needs to change — routes and
//      the dashboard only ever call getAvailableSlots/bookSlot.

const USE_REAL_GOOGLE = !!process.env.GOOGLE_REFRESH_TOKEN;

const WORKDAY_START_HOUR = 9; // 9am
const WORKDAY_END_HOUR = 17; // 5pm
const SLOT_MINUTES = 30;
const DAYS_TO_SCAN = 3;

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * MOCK MODE: deterministically fabricates a few "busy blocks" per recruiter
 * (seeded off their id so results are stable across refreshes) and returns
 * the first 3 free 30-min slots across the next `DAYS_TO_SCAN` working days.
 */
function getMockBusyBlocks(recruiterId, dayStart) {
  // Seed 2 fake meetings per day so slots feel realistic, not just "all free".
  const seed = recruiterId.charCodeAt(recruiterId.length - 1);
  const blocks = [];
  const m1 = new Date(dayStart);
  m1.setHours(WORKDAY_START_HOUR + (seed % 3), 0, 0, 0);
  blocks.push([m1, new Date(m1.getTime() + 60 * 60000)]);

  const m2 = new Date(dayStart);
  m2.setHours(WORKDAY_START_HOUR + 4 + (seed % 2), 30, 0, 0);
  blocks.push([m2, new Date(m2.getTime() + 30 * 60000)]);

  return blocks;
}

function overlaps(slotStart, slotEnd, busyStart, busyEnd) {
  return slotStart < busyEnd && slotEnd > busyStart;
}

async function getAvailableSlots(recruiter) {
  if (USE_REAL_GOOGLE) {
    return getAvailableSlotsFromGoogle(recruiter);
  }

  const slots = [];
  const now = new Date();

  for (let d = 0; d < DAYS_TO_SCAN + 3 && slots.length < 3; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    if (isWeekend(day)) continue;

    const dayStart = new Date(day);
    dayStart.setHours(WORKDAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(WORKDAY_END_HOUR, 0, 0, 0);

    const busy = getMockBusyBlocks(recruiter.id, dayStart);

    for (
      let cursor = new Date(dayStart);
      cursor < dayEnd && slots.length < 3;
      cursor = new Date(cursor.getTime() + SLOT_MINUTES * 60000)
    ) {
      // Skip slots already in the past (only matters for "today")
      if (cursor < now) continue;

      const slotEnd = new Date(cursor.getTime() + SLOT_MINUTES * 60000);
      const isBusy = busy.some(([bs, be]) => overlaps(cursor, slotEnd, bs, be));
      if (!isBusy) {
        slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
      }
    }
  }

  return slots.slice(0, 3);
}

async function bookSlot(recruiter, candidate, slot) {
  if (USE_REAL_GOOGLE) {
    return bookSlotOnGoogle(recruiter, candidate, slot);
  }

  // MOCK MODE: "creates" the event by logging it. In real mode this is
  // replaced by an actual events.insert call (see below).
  const event = {
    id: `mock_evt_${Date.now()}`,
    summary: `Interview: ${candidate.name}`,
    start: slot.start,
    end: slot.end,
    attendees: [recruiter.email, candidate.email],
    mock: true,
  };
  console.log(
    `[calendarService][MOCK] Locked calendar event for ${recruiter.name}:`,
    event
  );
  return event;
}

/* ---------------- REAL GOOGLE CALENDAR (reference implementation) ----------------

const { google } = require('googleapis');

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

async function getAvailableSlotsFromGoogle(recruiter) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const now = new Date();
  const timeMax = new Date(now.getTime() + DAYS_TO_SCAN * 24 * 60 * 60000);

  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: recruiter.email }],
    },
  });

  const busy = fb.data.calendars[recruiter.email].busy.map((b) => [
    new Date(b.start),
    new Date(b.end),
  ]);

  // ... walk the same working-hours grid as the mock version above,
  // filtering against `busy` instead of getMockBusyBlocks(), and return
  // the first 3 free slots.
}

async function bookSlotOnGoogle(recruiter, candidate, slot) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: recruiter.email,
    sendUpdates: 'all',
    requestBody: {
      summary: `Interview: ${candidate.name}`,
      start: { dateTime: slot.start },
      end: { dateTime: slot.end },
      attendees: [{ email: recruiter.email }, { email: candidate.email }],
    },
  });
  return res.data;
}

------------------------------------------------------------------------------- */

module.exports = { getAvailableSlots, bookSlot, USE_REAL_GOOGLE };
