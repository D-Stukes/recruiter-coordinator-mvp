// routes/booking.js
// Step 4: candidate clicks one of the 3 plain-text links in the email.
// Step 5: system locks the calendar + sends confirmations.

const express = require('express');
const db = require('../db');
const scheduler = require('../services/scheduler');

const router = express.Router();

function renderPage({ title, message, summary }) {
  // Deliberately plain/unstyled, per the MVP spec ("simple, unstyled
  // Success landing page") — a light summary list is added for clarity,
  // not a full redesign.
  const summaryHtml = summary
    ? `<dl>
        <dt>Candidate</dt><dd>${summary.candidateName}</dd>
        <dt>Client</dt><dd>${summary.clientName}</dd>
        <dt>Recruiter</dt><dd>${summary.recruiterName}</dd>
        <dt>Interview</dt><dd>${summary.slotLabel}</dd>
      </dl>`
    : '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
  ${summaryHtml}
</body>
</html>`;
}

router.get('/:candidateId/:slotIndex', async (req, res) => {
  const { candidateId, slotIndex } = req.params;
  const { token } = req.query;

  try {
    const candidate = await scheduler.bookCandidateSlot(
      candidateId,
      parseInt(slotIndex, 10),
      token
    );
    const recruiter = db.recruiters.find(candidate.recruiterId);
    const recruiterName = recruiter?.name || 'your recruiter';
    const clientName = 'the client'; // No client entity yet — see routes/booking.js history.

    const slotLabel = new Date(candidate.bookedSlot.start).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    res.status(200).send(
      renderPage({
        title: 'Success',
        message: `Congratulations, ${recruiterName}! Your candidate, ${candidate.name}, has successfully been scheduled to meet ${clientName} at ${slotLabel}.`,
        summary: {
          candidateName: candidate.name,
          clientName,
          recruiterName,
          slotLabel,
        },
      })
    );
  } catch (err) {
    res.status(400).send(
      renderPage({
        title: 'Unable to book that slot',
        message: err.message,
      })
    );
  }
});

module.exports = router;
