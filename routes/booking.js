// routes/booking.js
// Step 4: candidate clicks one of the 3 plain-text links in the email.
// Step 5: system locks the calendar + sends confirmations.

const express = require('express');
const db = require('../db');
const scheduler = require('../services/scheduler');

const router = express.Router();

function renderPage({ title, message, ok }) {
  // Deliberately plain/unstyled, per the MVP spec ("simple, unstyled
  // Success landing page").
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
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
    const slotLabel = new Date(candidate.bookedSlot.start).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    res
      .status(200)
      .send(
        renderPage({
          title: 'Success',
          message: `Thank you! Your interview is confirmed for ${slotLabel}.`,
          ok: true,
        })
      );
  } catch (err) {
    res.status(400).send(
      renderPage({
        title: 'Unable to book that slot',
        message: err.message,
        ok: false,
      })
    );
  }
});

module.exports = router;
