# Recruiter Coordinator — MVP

The end-of-week MVP: recruiter uploads candidates → system finds calendar
slots → candidate gets emailed 3 options → candidate books one → the
recruiter's calendar locks and both sides get confirmed. No logins, no
complex setup.

## The loop this app implements

1. **Recruiter uploads candidates** — dashboard form: pick your name from a
   dropdown, upload a CSV of `name,email` rows, click **Start Scheduling**.
   Candidates are saved with status `PENDING`.
2. **Availability parser runs** — for each candidate, the backend checks the
   recruiter's calendar for the next 3 working days and finds the first 3
   open 30-minute slots.
3. **Candidate gets emailed** — a plain-text email with 3 clickable time
   links goes out; status flips to `SLOTS_SENT`.
4. **Candidate picks a time** — clicking a link hits a simple unstyled
   "Thank you! Your interview is confirmed" success page.
5. **Calendar locks** — the event is created on the recruiter's calendar,
   status flips to `BOOKED`, and both the candidate and recruiter get a
   confirmation email.

The dashboard (`/`) shows every candidate's live status and a running log of
every email the system has sent, so you can watch the whole loop happen.

## Running it (mock mode — no API keys needed)

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

By default the app runs fully self-contained:
- **Google Calendar** is mocked — each recruiter gets deterministic fake
  "busy blocks" so slot-finding logic is real, just not hitting Google.
- **Email (SendGrid)** is mocked — "sent" emails are logged to the console
  and shown in the dashboard's Email Activity panel instead of leaving your
  machine.

This means you can demo Steps 1–5 end-to-end today:
1. Upload `public/sample-candidates.csv` (or your own CSV with `name,email`
   columns), pick a recruiter, click Start Scheduling.
2. Watch candidates move to `SLOTS_SENT` and see the outbound email appear
   in the Email Activity panel.
3. Copy one of the `/book/...` links out of that logged email and open it in
   a new tab — that's the candidate's side of Step 4.
4. Watch the candidate flip to `BOOKED` on the dashboard and see the
   confirmation + recruiter-alert emails land in the log.

## Going live with real Google Calendar / SendGrid

Copy `.env.example` to `.env` and fill in credentials:

```bash
cp .env.example .env
```

- Setting `GOOGLE_REFRESH_TOKEN` switches `services/calendarService.js` out
  of mock mode. A reference `googleapis` implementation is included
  (commented out) in that file — swap it in.
- Setting `SENDGRID_API_KEY` switches `services/emailService.js` out of mock
  mode the same way.

No other file needs to change — routes and the dashboard only ever call the
service functions (`getAvailableSlots`, `bookSlot`, `sendSlotsEmail`, etc.),
never a vendor SDK directly.

## Project structure

```
server.js                   Express app entrypoint
db.js                        Minimal JSON-file "database" (swap for real DB later)
routes/
  upload.js                  Step 1: CSV upload -> creates PENDING candidates, kicks off scheduling
  booking.js                 Step 4/5: candidate clicks a slot link -> books it
  api.js                      Read-only endpoints the dashboard polls
services/
  calendarService.js         Step 2: free/busy lookup + slot booking (mock + real Google hook)
  emailService.js             Step 3/5: candidate + recruiter emails (mock + real SendGrid hook)
  scheduler.js                 Orchestrates calendar + email for a candidate/batch
public/
  index.html, app.js, styles.css   Recruiter dashboard
  sample-candidates.csv        Ready-to-use demo CSV
data/
  recruiters.json              Seed list of recruiters shown in the dropdown (no login/auth in MVP)
  candidates.json, email_log.json   Runtime state (git-ignored, created on first run)
```

## Data model (MVP)

**Candidate**
```
id, name, email, recruiterId, status (PENDING | SLOTS_SENT | BOOKED),
slots (array of {start, end} ISO timestamps), bookingToken,
bookedSlot, calendarEventId, createdAt, updatedAt
```

**Recruiter** (seeded, no auth — just a dropdown of names)
```
id, name, email
```

## Known MVP limitations (by design, per scope)

- No authentication — recruiter picks their name from a dropdown.
- One shared calendar mock per recruiter id (deterministic, not persisted
  state) until real Google Calendar is wired in.
- File-based storage, not a production database — swap `db.js` for
  Postgres/Mongo/etc. when scaling past a demo.
- Booking links don't expire and re-clicking a booked link just shows the
  already-confirmed state rather than erroring.
