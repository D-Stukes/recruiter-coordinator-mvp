// services/scheduler.js
// Orchestrates Steps 2 & 3: pull slots for a candidate's recruiter, email
// the candidate the 3 options, and flip status PENDING -> SLOTS_SENT.

const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const calendarService = require('./calendarService');
const emailService = require('./emailService');

async function processCandidate(candidateId, baseUrl) {
  const candidate = db.candidates.find(candidateId);
  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);
  if (candidate.status !== 'PENDING') return candidate; // already processed

  const recruiter = db.recruiters.find(candidate.recruiterId);
  if (!recruiter) throw new Error(`Recruiter ${candidate.recruiterId} not found`);

  const slots = await calendarService.getAvailableSlots(recruiter);

  candidate.slots = slots;
  candidate.bookingToken = uuidv4();
  candidate.status = 'SLOTS_SENT';
  candidate.updatedAt = new Date().toISOString();
  db.candidates.save(candidate);

  await emailService.sendSlotsEmail(candidate, slots, baseUrl);

  return candidate;
}

/**
 * Process the whole freshly-uploaded batch, one at a time, in order —
 * mirroring "the system immediately triggers your backend scheduling code
 * for the first candidate in the list" (and then the rest, so the whole
 * batch reaches SLOTS_SENT without the recruiter doing anything else).
 */
async function processBatch(candidateIds, baseUrl) {
  const results = [];
  for (const id of candidateIds) {
    try {
      results.push(await processCandidate(id, baseUrl));
    } catch (err) {
      console.error(`[scheduler] Failed to process candidate ${id}:`, err.message);
    }
  }
  return results;
}

async function bookCandidateSlot(candidateId, slotIndex, token) {
  const candidate = db.candidates.find(candidateId);
  if (!candidate) throw new Error('Candidate not found');
  if (candidate.bookingToken !== token) throw new Error('Invalid or expired booking link');
  if (candidate.status === 'BOOKED') return candidate; // idempotent re-click
  if (candidate.status !== 'SLOTS_SENT') throw new Error('This candidate has no open slots to book');

  const slot = candidate.slots[slotIndex];
  if (!slot) throw new Error('Invalid slot selection');

  const recruiter = db.recruiters.find(candidate.recruiterId);

  const event = await calendarService.bookSlot(recruiter, candidate, slot);

  candidate.status = 'BOOKED';
  candidate.bookedSlot = slot;
  candidate.calendarEventId = event.id;
  candidate.updatedAt = new Date().toISOString();
  db.candidates.save(candidate);

  await emailService.sendCandidateConfirmation(candidate, slot);
  await emailService.sendRecruiterAlert(recruiter, candidate, slot);

  return candidate;
}

module.exports = { processCandidate, processBatch, bookCandidateSlot };
