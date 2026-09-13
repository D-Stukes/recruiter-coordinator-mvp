// services/emailService.js
//
// Step 3 ("Candidate Receives the Options") and Step 5 ("confirmation
// email/webhook") both flow through here.
//
// MVP DEFAULT: MOCK MODE — no SendGrid account needed. Emails are logged to
// the console AND appended to data/email_log.json so the dashboard can show
// "what would have been sent" during the demo.
//
// TO GO LIVE WITH SENDGRID:
//   1. npm install @sendgrid/mail
//   2. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env
//   3. Uncomment the sendReal() implementation below and it takes over
//      automatically (see the USE_REAL_EMAIL switch).

const db = require('../db');

const USE_REAL_EMAIL = !!process.env.SENDGRID_API_KEY;

async function send({ to, subject, text }) {
  if (USE_REAL_EMAIL) {
    return sendReal({ to, subject, text });
  }

  const entry = {
    to,
    subject,
    text,
    sentAt: new Date().toISOString(),
    mock: true,
  };
  console.log(`[emailService][MOCK] Email to ${to}: "${subject}"`);
  await db.emailLog.append(entry);
  return entry;
}

function slotsEmailBody(candidate, slots, baseUrl) {
  const lines = slots.map((slot, i) => {
    const label = new Date(slot.start).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const link = `${baseUrl}/book/${candidate.id}/${i}?token=${candidate.bookingToken}`;
    return `Option ${i + 1}: ${label}\n${link}`;
  });

  return (
    `Hi ${candidate.name},\n\n` +
    `We'd love to schedule your interview. Please click one of the links below to book your time:\n\n` +
    lines.join('\n\n') +
    `\n\nLooking forward to speaking with you!`
  );
}

async function sendSlotsEmail(candidate, slots, baseUrl) {
  return send({
    to: candidate.email,
    subject: `Schedule your interview, ${candidate.name}`,
    text: slotsEmailBody(candidate, slots, baseUrl),
  });
}

async function sendCandidateConfirmation(candidate, slot) {
  const label = new Date(slot.start).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return send({
    to: candidate.email,
    subject: 'Your interview is confirmed',
    text: `Hi ${candidate.name},\n\nYour interview is confirmed for ${label}. See you then!`,
  });
}

async function sendRecruiterAlert(recruiter, candidate, slot) {
  const label = new Date(slot.start).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return send({
    to: recruiter.email,
    subject: `${candidate.name} booked their interview`,
    text: `Hi ${recruiter.name},\n\n${candidate.name} (${candidate.email}) just booked their interview for ${label}. It's on your calendar.`,
  });
}

/* ---------------- REAL SENDGRID (reference implementation) ----------------

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendReal({ to, subject, text }) {
  return sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
  });
}

----------------------------------------------------------------------------- */

async function sendReal(/* { to, subject, text } */) {
  throw new Error(
    'SENDGRID_API_KEY is set but the real sendReal() implementation is still commented out in emailService.js'
  );
}

module.exports = {
  sendSlotsEmail,
  sendCandidateConfirmation,
  sendRecruiterAlert,
  USE_REAL_EMAIL,
};
